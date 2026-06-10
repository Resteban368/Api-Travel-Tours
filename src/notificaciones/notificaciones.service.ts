import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Notificacion } from './entities/notificacion.entity';
import { NotificacionVista } from './entities/notificacion-vista.entity';
import { CreateNotificacionDto } from './dto/create-notificacion.dto';
import { NotificacionesGateway } from './notificaciones.gateway';

export interface ListaNotificacionesQuery {
  solo_no_leidas?: boolean;
  limite?: number;
  pagina?: number;
}

@Injectable()
export class NotificacionesService {
  constructor(
    @InjectRepository(Notificacion)
    private readonly notificacionRepo: Repository<Notificacion>,

    @InjectRepository(NotificacionVista)
    private readonly vistaRepo: Repository<NotificacionVista>,

    private readonly gateway: NotificacionesGateway,
  ) {}

  // ─── CREAR Y EMITIR ───────────────────────────────────────────────────────

  async crearYEmitir(dto: CreateNotificacionDto, creadoBy?: number): Promise<Notificacion> {
    const notificacion = this.notificacionRepo.create({
      titulo: dto.titulo,
      mensaje: dto.mensaje,
      tipo: dto.tipo,
      usuario_id: dto.usuario_id ?? null,
      creado_by: creadoBy ?? null,
    });
    const guardada = await this.notificacionRepo.save(notificacion);

    const payload = {
      id: guardada.id,
      titulo: guardada.titulo,
      mensaje: guardada.mensaje,
      tipo: guardada.tipo,
      leida: false,
      created_at: guardada.created_at.toISOString(),
    };

    if (guardada.usuario_id != null) {
      this.gateway.pushToUser(guardada.usuario_id, payload);
    } else {
      this.gateway.pushToAll(payload);
    }

    return guardada;
  }

  // ─── LISTAR ───────────────────────────────────────────────────────────────

  async findAll(userId: number, query: ListaNotificacionesQuery) {
    const limite = query.limite ?? 20;
    const pagina = query.pagina ?? 1;
    const skip = (pagina - 1) * limite;

    // IDs de generales ya vistas por este usuario
    const vistasRaw = await this.vistaRepo.find({
      where: { usuario_id: userId },
      select: ['notificacion_id'],
    });
    const vistaIds = new Set(vistasRaw.map((v) => v.notificacion_id));

    const qb = this.notificacionRepo
      .createQueryBuilder('n')
      .where('(n.usuario_id = :uid OR n.usuario_id IS NULL)', { uid: userId })
      .orderBy('n.created_at', 'DESC')
      .skip(skip)
      .take(limite);

    const [items, total] = await qb.getManyAndCount();

    const data = items.map((n) => {
      const esGeneral = n.usuario_id === null;
      const leida = esGeneral ? vistaIds.has(n.id) : n.leida;
      return { ...n, leida };
    });

    const filtrado = query.solo_no_leidas ? data.filter((n) => !n.leida) : data;

    return {
      data: filtrado,
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
    };
  }

  // ─── CONTEO NO LEÍDAS ────────────────────────────────────────────────────

  async countNoLeidas(userId: number): Promise<number> {
    // Directas no leídas
    const directas = await this.notificacionRepo.count({
      where: { usuario_id: userId, leida: false },
    });

    // Generales no vistas
    const todasGenerales = await this.notificacionRepo.find({
      where: { usuario_id: IsNull() },
      select: ['id'],
    });
    const generalIds = todasGenerales.map((n) => n.id);

    if (generalIds.length === 0) return directas;

    const vistas = await this.vistaRepo.count({
      where: generalIds.map((nid) => ({ usuario_id: userId, notificacion_id: nid })),
    });

    return directas + (generalIds.length - vistas);
  }

  // ─── MARCAR UNA COMO LEÍDA ────────────────────────────────────────────────

  async marcarLeida(id: number, userId: number): Promise<{ id: number; leida: true }> {
    const notificacion = await this.notificacionRepo.findOne({ where: { id } });
    if (!notificacion) throw new NotFoundException(`Notificación ${id} no encontrada`);

    if (notificacion.usuario_id === null) {
      // General: insertar en notificacion_vista (ignorar si ya existe)
      await this.vistaRepo
        .createQueryBuilder()
        .insert()
        .into(NotificacionVista)
        .values({ usuario_id: userId, notificacion_id: id })
        .orIgnore()
        .execute();
    } else {
      // Directa: marcar leida
      await this.notificacionRepo.update({ id, usuario_id: userId }, { leida: true });
    }

    return { id, leida: true };
  }

  // ─── MARCAR TODAS COMO LEÍDAS ─────────────────────────────────────────────

  async marcarTodasLeidas(userId: number): Promise<{ actualizadas: number }> {
    let actualizadas = 0;

    // Directas no leídas
    const resultDirectas = await this.notificacionRepo.update(
      { usuario_id: userId, leida: false },
      { leida: true },
    );
    actualizadas += resultDirectas.affected ?? 0;

    // Generales no vistas aún
    const todasGenerales = await this.notificacionRepo.find({
      where: { usuario_id: IsNull() },
      select: ['id'],
    });

    if (todasGenerales.length > 0) {
      const generalIds = todasGenerales.map((n) => n.id);
      const yaVistas = await this.vistaRepo.find({
        where: generalIds.map((nid) => ({ usuario_id: userId, notificacion_id: nid })),
        select: ['notificacion_id'],
      });
      const yaVistasSet = new Set(yaVistas.map((v) => v.notificacion_id));
      const pendientes = generalIds.filter((nid) => !yaVistasSet.has(nid));

      if (pendientes.length > 0) {
        await this.vistaRepo
          .createQueryBuilder()
          .insert()
          .into(NotificacionVista)
          .values(pendientes.map((nid) => ({ usuario_id: userId, notificacion_id: nid })))
          .orIgnore()
          .execute();
        actualizadas += pendientes.length;
      }
    }

    return { actualizadas };
  }

  // ─── ELIMINAR ─────────────────────────────────────────────────────────────

  async remove(id: number): Promise<void> {
    const notificacion = await this.notificacionRepo.findOne({ where: { id } });
    if (!notificacion) throw new NotFoundException(`Notificación ${id} no encontrada`);
    await this.notificacionRepo.remove(notificacion);
  }
}
