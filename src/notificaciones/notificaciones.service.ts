import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Notificacion } from './entities/notificacion.entity';
import { NotificacionVista } from './entities/notificacion-vista.entity';
import { CreateNotificacionDto } from './dto/create-notificacion.dto';
import { NotificacionesGateway } from './notificaciones.gateway';
import { PermisoAgente } from '../modulos/entities/permiso-agente.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';

export interface ListaNotificacionesQuery {
  solo_no_leidas?: boolean;
  limite?: number;
  pagina?: number;
}

// Tipos que van solo a usuarios con permiso completo del módulo indicado
const TIPO_MODULO_MAP: Record<string, string> = {
  pago: 'pagos',
};

@Injectable()
export class NotificacionesService {
  constructor(
    @InjectRepository(Notificacion)
    private readonly notificacionRepo: Repository<Notificacion>,

    @InjectRepository(NotificacionVista)
    private readonly vistaRepo: Repository<NotificacionVista>,

    @InjectRepository(PermisoAgente)
    private readonly permisoRepo: Repository<PermisoAgente>,

    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,

    private readonly gateway: NotificacionesGateway,
  ) {}

  // ─── CREAR Y EMITIR ───────────────────────────────────────────────────────

  async crearYEmitir(
    dto: CreateNotificacionDto,
    creadoBy?: number,
  ): Promise<Notificacion | Notificacion[]> {
    // Destinatario específico → una sola notificación
    if (dto.usuario_id != null) {
      return this.crearUna(dto.usuario_id, dto, creadoBy);
    }

    // Tipo con módulo restringido → fan-out a usuarios con permiso
    const moduloNombre = TIPO_MODULO_MAP[dto.tipo];
    if (moduloNombre) {
      const userIds = await this.getDestinatariosModulo(moduloNombre);
      if (userIds.length === 0) return [];
      return Promise.all(userIds.map((uid) => this.crearUna(uid, dto, creadoBy)));
    }

    // Broadcast general
    const notificacion = this.notificacionRepo.create({
      titulo: dto.titulo,
      mensaje: dto.mensaje,
      tipo: dto.tipo,
      usuario_id: null,
      creado_by: creadoBy ?? null,
    });
    const guardada = await this.notificacionRepo.save(notificacion);

    this.gateway.pushToAll({
      id: guardada.id,
      titulo: guardada.titulo,
      mensaje: guardada.mensaje,
      tipo: guardada.tipo,
      leida: false,
      created_at: guardada.created_at.toISOString(),
    });

    return guardada;
  }

  // ─── PRIVADOS ─────────────────────────────────────────────────────────────

  private async crearUna(
    usuarioId: number,
    dto: CreateNotificacionDto,
    creadoBy?: number,
  ): Promise<Notificacion> {
    const notificacion = this.notificacionRepo.create({
      titulo: dto.titulo,
      mensaje: dto.mensaje,
      tipo: dto.tipo,
      usuario_id: usuarioId,
      creado_by: creadoBy ?? null,
    });
    const guardada = await this.notificacionRepo.save(notificacion);

    this.gateway.pushToUser(usuarioId, {
      id: guardada.id,
      titulo: guardada.titulo,
      mensaje: guardada.mensaje,
      tipo: guardada.tipo,
      leida: false,
      created_at: guardada.created_at.toISOString(),
    });

    return guardada;
  }

  private async getDestinatariosModulo(nombreModulo: string): Promise<number[]> {
    // Agentes con permiso completo al módulo
    const permisos = await this.permisoRepo
      .createQueryBuilder('p')
      .innerJoin('p.modulo', 'm')
      .where('m.nombre = :nombre', { nombre: nombreModulo })
      .andWhere('p.tipo_permiso = :tipo', { tipo: 'completo' })
      .select('p.usuario_id', 'usuario_id')
      .getRawMany<{ usuario_id: number }>();

    const agenteIds = permisos.map((p) => p.usuario_id);

    // Admins siempre reciben
    const admins = await this.usuarioRepo.find({
      where: { rol_nombre: 'admin', activo: true },
      select: ['id_usuario'],
    });
    const adminIds = admins.map((u) => u.id_usuario);

    return [...new Set([...agenteIds, ...adminIds])];
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
    const directas = await this.notificacionRepo.count({
      where: { usuario_id: userId, leida: false },
    });

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
      await this.vistaRepo
        .createQueryBuilder()
        .insert()
        .into(NotificacionVista)
        .values({ usuario_id: userId, notificacion_id: id })
        .orIgnore()
        .execute();
    } else {
      await this.notificacionRepo.update({ id, usuario_id: userId }, { leida: true });
    }

    return { id, leida: true };
  }

  // ─── MARCAR TODAS COMO LEÍDAS ─────────────────────────────────────────────

  async marcarTodasLeidas(userId: number): Promise<{ actualizadas: number }> {
    let actualizadas = 0;

    const resultDirectas = await this.notificacionRepo.update(
      { usuario_id: userId, leida: false },
      { leida: true },
    );
    actualizadas += resultDirectas.affected ?? 0;

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
    await this.notificacionRepo.softRemove(notificacion);
  }
}
