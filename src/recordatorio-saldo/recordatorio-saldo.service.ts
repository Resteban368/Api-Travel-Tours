import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reserva } from '../reservas/entities/reserva.entity';
import { PagoRealizado } from '../pagos-realizados/entities/pago-realizado.entity';
import { RecordatorioLog } from './entities/recordatorio-log.entity';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { RecordatorioSaldoDto } from './dto/recordatorio-saldo.dto';

@Injectable()
export class RecordatorioSaldoService {
  constructor(
    @InjectRepository(Reserva)
    private readonly reservaRepo: Repository<Reserva>,
    @InjectRepository(PagoRealizado)
    private readonly pagoRepo: Repository<PagoRealizado>,
    @InjectRepository(RecordatorioLog)
    private readonly logRepo: Repository<RecordatorioLog>,
    private readonly whatsappService: WhatsAppService,
  ) {}

  async enviar(dto: RecordatorioSaldoDto, actor?: { id: number; nombre: string }) {
    const reserva = await this.reservaRepo.findOne({ where: { id: dto.reserva_id } });
    if (!reserva) throw new NotFoundException(`Reserva ${dto.reserva_id} no encontrada`);
    if (reserva.estado === 'cancelado') throw new BadRequestException('La reserva está cancelada');

    const responsable = reserva.responsable;
    if (!responsable?.telefono) throw new BadRequestException('El responsable no tiene teléfono registrado');

    const tour = reserva.tour;
    if (!tour) throw new BadRequestException('La reserva no tiene tour asociado');

    // Saldo pendiente
    const pagosValidados = await this.pagoRepo.find({
      where: { reserva_id: dto.reserva_id, is_validated: true },
    });
    const totalPagado = pagosValidados.reduce((sum, p) => sum + Number(p.monto), 0);
    const saldoPendiente = reserva.valor_total - totalPagado;

    if (saldoPendiente <= 0) throw new BadRequestException('Esta reserva no tiene saldo pendiente');

    const cupos = 1 + (reserva.integrantes?.length ?? 0);

    const fecha = tour.fecha_inicio
      ? (() => {
          const d = new Date(tour.fecha_inicio);
          const dd = String(d.getUTCDate()).padStart(2, '0');
          const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
          const yyyy = d.getUTCFullYear();
          return `${dd}-${mm}-${yyyy}`;
        })()
      : 'Por confirmar';

    const saldo = new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(saldoPendiente);

    const phone = responsable.telefono.startsWith('+')
      ? responsable.telefono
      : `+57${responsable.telefono.replace(/\D/g, '')}`;

    const logBase = {
      reserva_id:        dto.reserva_id,
      id_reserva:        reserva.id_reserva,
      responsable_nombre: responsable.nombre,
      telefono:          phone,
      tour_nombre:       tour.nombre_tour,
      saldo_pendiente:   saldoPendiente,
      enviado_por_id:    actor?.id ?? null,
      enviado_por_nombre: actor?.nombre ?? null,
    };

    try {
      await this.whatsappService.sendRecordatorioSaldo({ phone, nombre: responsable.nombre, plan: tour.nombre_tour, fecha, cupos: String(cupos), saldo });
      await this.logRepo.save(this.logRepo.create({ ...logBase, estado: 'enviado', error: null }));
    } catch (err) {
      await this.logRepo.save(this.logRepo.create({ ...logBase, estado: 'fallido', error: err?.message ?? 'Error desconocido' }));
      throw err;
    }

    return {
      ok:              true,
      reserva_id:      dto.reserva_id,
      id_reserva:      reserva.id_reserva,
      responsable:     responsable.nombre,
      telefono:        phone,
      saldo_pendiente: saldoPendiente,
    };
  }

  async getLogs(page = 1, limit = 50) {
    const [items, total] = await this.logRepo.findAndCount({
      order: { fecha_envio: 'DESC' },
      take:  limit,
      skip:  (page - 1) * limit,
    });
    return { total, page, limit, items };
  }
}
