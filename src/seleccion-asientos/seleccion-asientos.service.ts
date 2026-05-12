import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ReservaSeleccionToken } from './entities/reserva-seleccion-token.entity';
import { AsientoSeleccionado } from './entities/asiento-seleccionado.entity';
import { Reserva } from '../reservas/entities/reserva.entity';
import { BusLayout } from '../bus-layouts/entities/bus-layout.entity';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

const HOLD_MINUTOS = 8;

@Injectable()
export class SeleccionAsientosService {
  constructor(
    @InjectRepository(ReservaSeleccionToken)
    private readonly tokenRepo: Repository<ReservaSeleccionToken>,
    @InjectRepository(AsientoSeleccionado)
    private readonly asientoRepo: Repository<AsientoSeleccionado>,
    @InjectRepository(Reserva)
    private readonly reservaRepo: Repository<Reserva>,
    @InjectRepository(BusLayout)
    private readonly busLayoutRepo: Repository<BusLayout>,
    private readonly whatsappService: WhatsAppService,
  ) {}

  // ─── Generación de token (llamado desde ReservasService) ─────────────────

  async generarToken(reservaId: number): Promise<ReservaSeleccionToken> {
    const token = uuidv4();
    const baseUrl = (process.env.APP_URL ?? 'http://localhost:3001').replace(/\/$/, '');
    const link = `${baseUrl}/seleccion/${token}`;

    const record = this.tokenRepo.create({ reserva_id: reservaId, token, link });
    return this.tokenRepo.save(record);
  }

  async getAsientosConfirmados(reservaId: number): Promise<string[]> {
    const asientos = await this.asientoRepo.find({
      where: { reserva_id: reservaId, estado: 'confirmado' },
      order: { numero_asiento: 'ASC' },
    });
    return asientos.map((a) => a.numero_asiento);
  }

  async getTokensBatch(reservaIds: number[]): Promise<Map<number, string>> {
    if (reservaIds.length === 0) return new Map();
    const tokens = await this.tokenRepo.find({ where: { reserva_id: In(reservaIds) } });
    const map = new Map<number, string>();
    for (const t of tokens) map.set(t.reserva_id, t.link);
    return map;
  }

  async getAsientosConfirmadosBatch(reservaIds: number[]): Promise<Map<number, string[]>> {
    if (reservaIds.length === 0) return new Map();
    const asientos = await this.asientoRepo.find({
      where: { reserva_id: In(reservaIds), estado: 'confirmado' },
    });
    const map = new Map<number, string[]>();
    for (const a of asientos) {
      const lista = map.get(a.reserva_id) ?? [];
      lista.push(a.numero_asiento);
      map.set(a.reserva_id, lista);
    }
    return map;
  }

  async confirmarAsientosDirecto(reservaId: number, numeros: string[]): Promise<void> {
    if (numeros.length === 0) return;
    await this.asientoRepo.delete({ reserva_id: reservaId });
    const nuevos = numeros.map((numero_asiento) =>
      this.asientoRepo.create({ reserva_id: reservaId, numero_asiento, estado: 'confirmado' }),
    );
    await this.asientoRepo.save(nuevos);
  }

  async liberarUnAsiento(reservaId: number, numero: string): Promise<void> {
    await this.asientoRepo.delete({ reserva_id: reservaId, numero_asiento: numero });
  }

  async moverAsiento(
    reservaIdOrigen: number,
    asientoOrigen: string,
    asientoDestino: string,
    reservaIdDestino: number | null,
  ): Promise<void> {
    if (reservaIdDestino !== null) {
      // Swap: delete both and reinsert with swapped numbers
      await this.asientoRepo.delete({ reserva_id: reservaIdOrigen, numero_asiento: asientoOrigen });
      await this.asientoRepo.delete({ reserva_id: reservaIdDestino, numero_asiento: asientoDestino });
      await this.asientoRepo.save([
        this.asientoRepo.create({ reserva_id: reservaIdOrigen, numero_asiento: asientoDestino, estado: 'confirmado' }),
        this.asientoRepo.create({ reserva_id: reservaIdDestino, numero_asiento: asientoOrigen, estado: 'confirmado' }),
      ]);
    } else {
      // Move to free seat: update numero_asiento in place
      await this.asientoRepo.update(
        { reserva_id: reservaIdOrigen, numero_asiento: asientoOrigen },
        { numero_asiento: asientoDestino },
      );
    }
  }

  async getOrGenerarLink(reservaId: number): Promise<string | null> {
    const existing = await this.tokenRepo.findOne({ where: { reserva_id: reservaId } });
    if (existing) return existing.link;

    // Verificar que la reserva tiene bus_layout_id antes de generar
    const reserva = await this.reservaRepo.findOne({ where: { id: reservaId } });
    if (!reserva?.bus_layout_id) return null;

    const record = await this.generarToken(reservaId);
    return record.link;
  }

  // ─── Endpoints públicos ───────────────────────────────────────────────────

  async getInfoSeleccion(token: string) {
    const { reserva, layout } = await this._resolverToken(token);

    const totalPersonas = 1 + (reserva.integrantes?.length ?? 0);
    const now = new Date();

    // Asientos confirmados de ESTA reserva
    const propios = await this.asientoRepo.find({
      where: { reserva_id: reserva.id, estado: 'confirmado' },
    });

    // Holds activos de ESTA reserva (para restaurar el timer en el cliente)
    const holdsActivos = await this.asientoRepo
      .createQueryBuilder('a')
      .where('a.reserva_id = :rid', { rid: reserva.id })
      .andWhere('a.estado = :s', { s: 'hold' })
      .andWhere('a.hold_expires_at > :now', { now })
      .getMany();

    // Asientos ocupados por OTRAS reservas (confirmados + holds activos)
    const asientosOcupados = await this._getAsientosOcupados(
      reserva.id,
      reserva.tour?.id,
      reserva.bus_layout_id!,
    );

    return {
      reserva: {
        id: reserva.id,
        id_reserva: reserva.id_reserva,
        total_personas: totalPersonas,
        asientos_requeridos: totalPersonas,
        responsable_nombre: reserva.responsable?.nombre ?? null,
        tour: reserva.tour
          ? {
              nombre: reserva.tour.nombre_tour,
              fecha_inicio: reserva.tour.fecha_inicio,
              fecha_fin: reserva.tour.fecha_fin,
            }
          : null,
      },
      layout: {
        id: layout.id,
        nombre: layout.nombre,
        descripcion: layout.descripcion,
        total_asientos_cliente: layout.total_asientos_cliente,
        configuracion: layout.configuracion,
      },
      asientos_ocupados: asientosOcupados,
      asientos_propios: propios.map((a) => a.numero_asiento),
      asientos_en_hold: holdsActivos.map((a) => a.numero_asiento),
      hold_expires_at: holdsActivos[0]?.hold_expires_at ?? null,
      confirmado: propios.length > 0,
    };
  }

  async verificarCedula(token: string, cedula: string) {
    const tokenRecord = await this.tokenRepo.findOne({ where: { token } });
    if (!tokenRecord) throw new NotFoundException('Link de selección no válido');

    const reserva = await this.reservaRepo.findOne({ where: { id: tokenRecord.reserva_id } });
    if (!reserva) throw new NotFoundException('Reserva no encontrada');

    if (!reserva.responsable) {
      throw new BadRequestException('La reserva no tiene un responsable asignado');
    }

    const documentoResp = (reserva.responsable.documento ?? '').trim();
    const cedulaInput = cedula.trim();

    if (documentoResp === '' || documentoResp !== cedulaInput) {
      throw new BadRequestException('Cédula incorrecta. Verifica el número e intenta de nuevo.');
    }

    return { ok: true, nombre: reserva.responsable.nombre };
  }

  async holdAsientos(token: string, asientos: string[]): Promise<{ ok: boolean; expires_at: Date | null }> {
    const { reserva } = await this._resolverToken(token);

    // Si viene lista vacía → liberar hold
    if (asientos.length === 0) {
      await this.asientoRepo.delete({ reserva_id: reserva.id, estado: 'hold' });
      return { ok: true, expires_at: null };
    }

    // Verificar disponibilidad (excluir los holds actuales de esta misma reserva)
    await this.asientoRepo.delete({ reserva_id: reserva.id, estado: 'hold' });

    const ocupados = await this._getAsientosOcupados(
      reserva.id,
      reserva.tour?.id,
      reserva.bus_layout_id!,
    );
    const conflictos = asientos.filter((n) => ocupados.includes(n));
    if (conflictos.length > 0) {
      throw new BadRequestException(
        `Los asientos ${conflictos.join(', ')} ya fueron tomados. Selecciona otros.`,
      );
    }

    const expiresAt = new Date(Date.now() + HOLD_MINUTOS * 60 * 1000);
    const nuevos = asientos.map((numero_asiento) =>
      this.asientoRepo.create({
        reserva_id: reserva.id,
        numero_asiento,
        estado: 'hold',
        hold_expires_at: expiresAt,
      }),
    );
    await this.asientoRepo.save(nuevos);

    return { ok: true, expires_at: expiresAt };
  }

  async releaseHold(token: string): Promise<{ ok: boolean }> {
    const tokenRecord = await this.tokenRepo.findOne({ where: { token } });
    if (!tokenRecord) return { ok: true };
    await this.asientoRepo.delete({ reserva_id: tokenRecord.reserva_id, estado: 'hold' });
    return { ok: true };
  }

  async confirmarSeleccion(token: string, cedula: string, asientosElegidos: string[]) {
    const { reserva, layout } = await this._resolverToken(token);

    // Re-verificar cédula
    if (!reserva.responsable) throw new BadRequestException('La reserva no tiene un responsable asignado');
    const documentoResp = (reserva.responsable.documento ?? '').trim();
    if (documentoResp === '' || documentoResp !== cedula.trim()) {
      throw new BadRequestException('Cédula incorrecta');
    }

    const totalPersonas = 1 + (reserva.integrantes?.length ?? 0);
    if (asientosElegidos.length !== totalPersonas) {
      throw new BadRequestException(
        `Debes seleccionar exactamente ${totalPersonas} asiento(s). Seleccionaste ${asientosElegidos.length}.`,
      );
    }

    // Validar que sean asientos tipo 'normal'
    const asientosNormales = new Set(
      layout.configuracion.asientos.filter((a) => a.tipo === 'normal').map((a) => a.numero),
    );
    const invalidos = asientosElegidos.filter((n) => !asientosNormales.has(n));
    if (invalidos.length > 0) {
      throw new BadRequestException(`Asientos inválidos: ${invalidos.join(', ')}`);
    }

    // Verificar disponibilidad (ignorar holds propios — el confirm los reemplaza)
    await this.asientoRepo.delete({ reserva_id: reserva.id, estado: 'hold' });
    const ocupados = await this._getAsientosOcupados(reserva.id, reserva.tour?.id, reserva.bus_layout_id!);
    const conflictos = asientosElegidos.filter((n) => ocupados.includes(n));
    if (conflictos.length > 0) {
      throw new BadRequestException(`Los asientos ${conflictos.join(', ')} ya fueron tomados. Actualiza y vuelve a intentar.`);
    }

    // Eliminar registros previos y guardar confirmados
    await this.asientoRepo.delete({ reserva_id: reserva.id });
    const nuevos = asientosElegidos.map((numero_asiento) =>
      this.asientoRepo.create({ reserva_id: reserva.id, numero_asiento, estado: 'confirmado' }),
    );
    await this.asientoRepo.save(nuevos);

    // Notificar por WhatsApp (best-effort)
    const telefono = reserva.responsable?.telefono ?? null;
    if (telefono) {
      const tourNombre = reserva.tour?.nombre_tour ?? 'tu tour';
      const asientosTexto = asientosElegidos.join(', ');
      const mensaje =
        `✅ *Selección de asientos confirmada*\n\n` +
        `Hola ${reserva.responsable!.nombre}, tus asientos para *${tourNombre}* han sido reservados.\n\n` +
        `🪑 *Asientos:* ${asientosTexto}\n` +
        `📋 *Reserva:* ${reserva.id_reserva}\n\n` +
        `¡Gracias por tu reserva! Si tienes alguna duda, contáctanos.`;
      void this.whatsappService.sendWhatsAppDirect(telefono, mensaje);
    }

    return {
      ok: true,
      asientos: asientosElegidos,
      mensaje: '¡Tu selección de asientos fue guardada exitosamente!',
    };
  }

  async findByReservaId(reservaId: number): Promise<ReservaSeleccionToken | null> {
    return this.tokenRepo.findOne({ where: { reserva_id: reservaId } });
  }

  // ─── Helpers privados ─────────────────────────────────────────────────────

  private async _resolverToken(token: string): Promise<{ reserva: Reserva; layout: BusLayout }> {
    const tokenRecord = await this.tokenRepo.findOne({ where: { token } });
    if (!tokenRecord) throw new NotFoundException('Link de selección no válido');

    const reserva = await this.reservaRepo.findOne({ where: { id: tokenRecord.reserva_id } });
    if (!reserva) throw new NotFoundException('Reserva no encontrada');
    if (!reserva.bus_layout_id) throw new BadRequestException('Esta reserva no tiene bus asignado');

    const layout = await this.busLayoutRepo.findOne({ where: { id: reserva.bus_layout_id } });
    if (!layout) throw new NotFoundException('Layout de bus no encontrado');

    return { reserva, layout };
  }

  private async _getAsientosOcupados(
    reservaIdActual: number,
    tourId: number | undefined,
    busLayoutId: number,
  ): Promise<string[]> {
    // Otras reservas del mismo tour y mismo bus layout
    const where: any = { bus_layout_id: busLayoutId };
    if (tourId) where.tour = { id: tourId };

    const otrasReservas = await this.reservaRepo.find({ where });
    const otrasIds = otrasReservas.map((r) => r.id).filter((id) => id !== reservaIdActual);

    if (otrasIds.length === 0) return [];

    const now = new Date();
    const ocupados = await this.asientoRepo
      .createQueryBuilder('a')
      .where('a.reserva_id IN (:...ids)', { ids: otrasIds })
      .andWhere(
        "(a.estado = 'confirmado' OR (a.estado = 'hold' AND a.hold_expires_at > :now))",
        { now },
      )
      .getMany();

    return ocupados.map((a) => a.numero_asiento);
  }
}
