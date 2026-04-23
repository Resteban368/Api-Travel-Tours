import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { PagoRealizado } from '../pagos-realizados/entities/pago-realizado.entity';
import { Reserva } from '../reservas/entities/reserva.entity';
import { Cotizacion } from '../cotizaciones/entities/cotizacion.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(PagoRealizado)
    private readonly pagosRepo: Repository<PagoRealizado>,
    @InjectRepository(Reserva)
    private readonly reservasRepo: Repository<Reserva>,
    @InjectRepository(Cotizacion)
    private readonly cotizacionesRepo: Repository<Cotizacion>,
    @InjectRepository(Usuario)
    private readonly usuariosRepo: Repository<Usuario>,
  ) {}

  private getRange(periodo: string): { start: Date; end: Date } {
    const now = new Date();
    if (periodo === 'dia') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { start, end };
    }
    if (periodo === 'semana') {
      const day = now.getDay(); // 0 = domingo
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      return { start: monday, end: sunday };
    }
    // mes
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }

  async getAnalytics(periodo: string) {
    const { start, end } = this.getRange(periodo);
    const dateRange = Between(start, end);

    // 1. Pagos validados en el período
    const pagosValidados = await this.pagosRepo.find({
      where: { is_validated: true, fecha_creacion: dateRange },
      order: { fecha_creacion: 'DESC' },
    });
    const montoTotal = pagosValidados.reduce((sum, p) => sum + Number(p.monto), 0);

    // 2. Reservas de tour en el período
    const reservasTour = await this.reservasRepo.find({
      where: { tipo_reserva: 'tour', fecha_creacion: dateRange },
      order: { fecha_creacion: 'DESC' },
    });

    // 3. Cotizaciones en el período
    const cotizaciones = await this.cotizacionesRepo.find({
      where: { created_at: dateRange },
      order: { created_at: 'DESC' },
    });

    // 4. Reservas de vuelo agrupadas por agente
    const reservasVuelo = await this.reservasRepo.find({
      where: { tipo_reserva: 'vuelos', fecha_creacion: dateRange },
      order: { fecha_creacion: 'DESC' },
    });

    const agenteIds = [
      ...new Set(
        reservasVuelo
          .map((r) => r.creado_por_id)
          .filter((id): id is number => id !== null && id !== undefined),
      ),
    ];

    const agentes =
      agenteIds.length > 0
        ? await this.usuariosRepo.find({ where: { id_usuario: In(agenteIds) } })
        : [];

    const vuelosPorAgente = agenteIds.map((id) => {
      const agente = agentes.find((a) => a.id_usuario === id);
      const reservasDelAgente = reservasVuelo.filter((r) => r.creado_por_id === id);
      return {
        agente_id: id,
        agente_nombre: agente?.nombre ?? `Agente #${id}`,
        total_reservas: reservasDelAgente.length,
        reservas: reservasDelAgente.map((r) => ({
          id: r.id,
          id_reserva: r.id_reserva,
          correo: r.correo,
          estado: r.estado,
          valor_total: Number(r.valor_total),
          fecha_creacion: r.fecha_creacion,
        })),
      };
    });

    // Reservas de vuelo sin agente asignado
    const sinAgente = reservasVuelo.filter((r) => !r.creado_por_id);
    if (sinAgente.length > 0) {
      vuelosPorAgente.push({
        agente_id: null as any,
        agente_nombre: 'Sin agente',
        total_reservas: sinAgente.length,
        reservas: sinAgente.map((r) => ({
          id: r.id,
          id_reserva: r.id_reserva,
          correo: r.correo,
          estado: r.estado,
          valor_total: Number(r.valor_total),
          fecha_creacion: r.fecha_creacion,
        })),
      });
    }

    return {
      periodo,
      fecha_inicio: start,
      fecha_fin: end,
      pagos_validados: {
        total: pagosValidados.length,
        monto_total: montoTotal,
        items: pagosValidados.map((p) => ({
          id_pago: p.id_pago,
          monto: Number(p.monto),
          metodo_pago: p.metodo_pago,
          referencia: p.referencia,
          proveedor_comercio: p.proveedor_comercio,
          reserva_id: p.reserva_id,
          fecha_creacion: p.fecha_creacion,
        })),
      },
      reservas_tour: {
        total: reservasTour.length,
        items: reservasTour.map((r) => ({
          id: r.id,
          id_reserva: r.id_reserva,
          correo: r.correo,
          estado: r.estado,
          valor_total: Number(r.valor_total),
          integrantes_count: (r.integrantes?.length ?? 0) + 1,
          tour_nombre: r.tour?.nombre_tour ?? null,
          fecha_creacion: r.fecha_creacion,
        })),
      },
      cotizaciones: {
        total: cotizaciones.length,
        items: cotizaciones.map((c) => ({
          id: c.id,
          nombre_completo: c.nombre_completo,
          detalles_plan: c.detalles_plan,
          numero_pasajeros: c.numero_pasajeros,
          origen_destino: c.origen_destino,
          estado: c.estado,
          is_read: c.is_read,
          created_at: c.created_at,
        })),
      },
      vuelos_por_agente: vuelosPorAgente,
    };
  }
}
