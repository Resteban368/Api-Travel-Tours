import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, IsNull, Not } from 'typeorm';
import { PagoRealizado } from '../pagos-realizados/entities/pago-realizado.entity';
import { Reserva } from '../reservas/entities/reserva.entity';
import { Cotizacion } from '../cotizaciones/entities/cotizacion.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { ToursMaestro } from '../tours/entities/tours-maestro.entity';
import { RespuestaCotizacion } from '../cotizaciones/entities/respuesta-cotizacion.entity';
import { CotizacionRespuestaVista } from '../cotizaciones/entities/cotizacion-respuesta-vista.entity';

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
    @InjectRepository(ToursMaestro)
    private readonly toursRepo: Repository<ToursMaestro>,
    @InjectRepository(RespuestaCotizacion)
    private readonly respuestasRepo: Repository<RespuestaCotizacion>,
    @InjectRepository(CotizacionRespuestaVista)
    private readonly vistasRepo: Repository<CotizacionRespuestaVista>,
  ) {}

  private getRange(periodo: string): { start: Date; end: Date } {
    const now = new Date();
    if (periodo === 'dia') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { start, end };
    }
    if (periodo === 'semana') {
      const day = now.getDay();
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

    // ── 1. Pagos validados en el período ─────────────────────────────────────
    const pagosValidados = await this.pagosRepo.find({
      where: { is_validated: true, fecha_creacion: dateRange },
      order: { fecha_creacion: 'DESC' },
    });
    const montoTotal = pagosValidados.reduce((sum, p) => sum + Number(p.monto), 0);

    // ── 2. Reservas de tour en el período ─────────────────────────────────────
    const reservasTour = await this.reservasRepo.find({
      where: { tipo_reserva: 'tour', fecha_creacion: dateRange },
      order: { fecha_creacion: 'DESC' },
    });

    // Pagos validados de reservas de tour para calcular saldo
    const reservaTourIds = reservasTour.map((r) => r.id).filter(Boolean);
    const pagosTour =
      reservaTourIds.length > 0
        ? await this.pagosRepo.find({
            where: { is_validated: true, reserva_id: In(reservaTourIds) },
          })
        : [];

    // ── 3. Cotizaciones en el período ─────────────────────────────────────────
    const cotizaciones = await this.cotizacionesRepo.find({
      where: { created_at: dateRange },
      order: { created_at: 'DESC' },
    });

    // ── 4. Reservas de vuelo en el período ────────────────────────────────────
    const reservasVuelo = await this.reservasRepo.find({
      where: { tipo_reserva: 'vuelos', fecha_creacion: dateRange },
      order: { fecha_creacion: 'DESC' },
    });

    // ── Respuestas de cotización creadas en el período ────────────────────────
    const respuestasCotizacion = await this.respuestasRepo.find({
      where: { created_at: dateRange },
    });

    // ── Métricas de respuestas de cotización ──────────────────────────────────
    const respuestasConCotizacion      = respuestasCotizacion.filter(r => r.cotizacion_id !== null);
    const respuestasSinCotizacionNoPl  = respuestasCotizacion.filter(r => r.cotizacion_id === null && !r.es_publica);
    const idsSinCotNoPl                = respuestasSinCotizacionNoPl.map(r => r.id);
    const vistasSinCotNoPl             = idsSinCotNoPl.length
      ? await this.vistasRepo.createQueryBuilder('v')
          .select('DISTINCT v.respuesta_id', 'respuesta_id')
          .where('v.respuesta_id IN (:...ids)', { ids: idsSinCotNoPl })
          .getRawMany()
      : [];
    const idsLeidas                    = new Set(vistasSinCotNoPl.map(v => Number(v.respuesta_id)));

    // ── Todas las reservas del período (tour + vuelo) ─────────────────────────
    const todasReservas = [...reservasTour, ...reservasVuelo];

    // ── IDs de agentes únicos de todas las reservas ───────────────────────────
    const todosAgenteIds = [
      ...new Set(
        todasReservas
          .map((r) => r.creado_por_id)
          .filter((id): id is number => id !== null && id !== undefined),
      ),
    ];
    const todosAgentes =
      todosAgenteIds.length > 0
        ? await this.usuariosRepo.find({ where: { id_usuario: In(todosAgenteIds) } })
        : [];

    // ── 5. Vuelos por agente (ya existente) ───────────────────────────────────
    const agenteIdsVuelo = [
      ...new Set(
        reservasVuelo
          .map((r) => r.creado_por_id)
          .filter((id): id is number => id !== null && id !== undefined),
      ),
    ];

    const vuelosPorAgente = agenteIdsVuelo.map((id) => {
      const agente = todosAgentes.find((a) => a.id_usuario === id);
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

    const sinAgenteVuelo = reservasVuelo.filter((r) => !r.creado_por_id);
    if (sinAgenteVuelo.length > 0) {
      vuelosPorAgente.push({
        agente_id: null as any,
        agente_nombre: 'Sin agente',
        total_reservas: sinAgenteVuelo.length,
        reservas: sinAgenteVuelo.map((r) => ({
          id: r.id,
          id_reserva: r.id_reserva,
          correo: r.correo,
          estado: r.estado,
          valor_total: Number(r.valor_total),
          fecha_creacion: r.fecha_creacion,
        })),
      });
    }

    // ── 6. Rendimiento por agente (tour + vuelo + respuestas cotización) ──────
    // Incluir también agentes que solo tienen respuestas de cotización
    const agenteIdsRespuestas = respuestasCotizacion
      .map((r) => r.creado_por_id)
      .filter((id): id is number => id !== null && id !== undefined);

    const todosAgenteIdsCombinados = [
      ...new Set([...todosAgenteIds, ...agenteIdsRespuestas]),
    ];

    const agentesExtras = agenteIdsRespuestas.filter(
      (id) => !todosAgenteIds.includes(id),
    );
    const todosAgentesCompletos =
      agentesExtras.length > 0
        ? [
            ...todosAgentes,
            ...(await this.usuariosRepo.find({
              where: { id_usuario: In(agentesExtras) },
            })),
          ]
        : todosAgentes;

    const rendimientoPorAgente = todosAgenteIdsCombinados.map((id) => {
      const agente = todosAgentesCompletos.find((a) => a.id_usuario === id);
      const toursAgente = reservasTour.filter((r) => r.creado_por_id === id);
      const vuelosAgente = reservasVuelo.filter((r) => r.creado_por_id === id);
      const respuestasAgente = respuestasCotizacion.filter(
        (r) => r.creado_por_id === id,
      );
      const montoGestionado = [...toursAgente, ...vuelosAgente].reduce(
        (sum, r) => sum + Number(r.valor_total),
        0,
      );
      return {
        agente_id: id,
        agente_nombre: agente?.nombre ?? `Agente #${id}`,
        reservas_tour: toursAgente.length,
        reservas_vuelo: vuelosAgente.length,
        total_reservas: toursAgente.length + vuelosAgente.length,
        respuestas_cotizacion: respuestasAgente.length,
        monto_gestionado: montoGestionado,
      };
    }).sort((a, b) => b.total_reservas - a.total_reservas);

    // ── 7. Ingresos por tour ──────────────────────────────────────────────────
    const ingresosPorTour: Record<
      number,
      { tour_id: number; tour_nombre: string; total_reservas: number; monto_recaudado: number }
    > = {};
    for (const r of reservasTour) {
      if (!r.tour) continue;
      const tid = r.tour.id;
      if (!ingresosPorTour[tid]) {
        ingresosPorTour[tid] = {
          tour_id: tid,
          tour_nombre: r.tour.nombre_tour,
          total_reservas: 0,
          monto_recaudado: 0,
        };
      }
      ingresosPorTour[tid].total_reservas += 1;
      const pagadoEstaReserva = pagosTour
        .filter((p) => p.reserva_id === r.id)
        .reduce((sum, p) => sum + Number(p.monto), 0);
      ingresosPorTour[tid].monto_recaudado += pagadoEstaReserva;
    }
    const ingresosTour = Object.values(ingresosPorTour).sort(
      (a, b) => b.monto_recaudado - a.monto_recaudado,
    );

    // ── 8. Tours más vendidos ─────────────────────────────────────────────────
    const ventasPorTour: Record<
      number,
      { tour_id: number; tour_nombre: string; total_reservas: number; total_pasajeros: number; valor_total_generado: number }
    > = {};
    for (const r of reservasTour) {
      if (!r.tour) continue;
      const tid = r.tour.id;
      if (!ventasPorTour[tid]) {
        ventasPorTour[tid] = {
          tour_id: tid,
          tour_nombre: r.tour.nombre_tour,
          total_reservas: 0,
          total_pasajeros: 0,
          valor_total_generado: 0,
        };
      }
      ventasPorTour[tid].total_reservas += 1;
      ventasPorTour[tid].total_pasajeros += (r.integrantes?.length ?? 0) + 1;
      ventasPorTour[tid].valor_total_generado += Number(r.valor_total);
    }
    const toursMasVendidos = Object.values(ventasPorTour).sort(
      (a, b) => b.total_reservas - a.total_reservas,
    );

    // ── 9. Destinos más solicitados (cotizaciones) ────────────────────────────
    const normalize = (s: string) =>
      s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // key normalizado → { nombre display, total }
    const destinoMap: Record<string, { destino: string; total: number }> = {};
    for (const c of cotizaciones) {
      if (!c.destino) continue;
      const key = normalize(c.destino);
      if (!destinoMap[key]) {
        // Guardar la primera versión con tilde como nombre display
        destinoMap[key] = { destino: c.destino.trim(), total: 0 };
      }
      destinoMap[key].total += 1;
    }
    const destinosMasSolicitados = Object.values(destinoMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // ── 10. Servicios adicionales más contratados ─────────────────────────────
    const servicioCount: Record<
      number,
      { servicio_id: number; nombre: string; veces_contratado: number; ingreso_total: number }
    > = {};
    for (const r of reservasTour) {
      for (const s of r.servicios ?? []) {
        if (!servicioCount[s.id_servicio]) {
          servicioCount[s.id_servicio] = {
            servicio_id: s.id_servicio,
            nombre: s.nombre_servicio,
            veces_contratado: 0,
            ingreso_total: 0,
          };
        }
        servicioCount[s.id_servicio].veces_contratado += 1;
        servicioCount[s.id_servicio].ingreso_total += Number(s.costo ?? 0);
      }
    }
    const serviciosMasContratados = Object.values(servicioCount).sort(
      (a, b) => b.veces_contratado - a.veces_contratado,
    );

    // ── 11. Ocupación por tour activo ─────────────────────────────────────────
    const toursActivos = await this.toursRepo.find({
      where: { is_active: true, es_borrador: false },
    });

    // Contar pasajeros por tour de TODAS las reservas (no solo del período)
    const reservasTourTodas = await this.reservasRepo.find({
      where: { tipo_reserva: 'tour' },
    });

    const pasajerosPorTour: Record<number, number> = {};
    for (const r of reservasTourTodas) {
      if (!r.tour?.id) continue;
      pasajerosPorTour[r.tour.id] =
        (pasajerosPorTour[r.tour.id] ?? 0) + (r.integrantes?.length ?? 0) + 1;
    }

    const ocupacionPorTour = toursActivos
      .filter((t) => t.cupos !== null)
      .map((t) => {
        const ocupados = pasajerosPorTour[t.id] ?? 0;
        const cupos = t.cupos ?? 0;
        const disponibles = Math.max(0, cupos - ocupados);
        const porcentaje = cupos > 0 ? Math.round((ocupados / cupos) * 100) : 0;
        return {
          tour_id: t.id,
          tour_nombre: t.nombre_tour,
          fecha_inicio: t.fecha_inicio,
          fecha_fin: t.fecha_fin,
          cupos_totales: cupos,
          cupos_ocupados: ocupados,
          cupos_disponibles: disponibles,
          porcentaje_ocupacion: porcentaje,
        };
      })
      .sort((a, b) => b.porcentaje_ocupacion - a.porcentaje_ocupacion);

    // ── 12. Evolución de reservas día a día ───────────────────────────────────
    const reservasEvolucion: Record<string, number> = {};
    for (const r of [...reservasTour, ...reservasVuelo]) {
      const dia = r.fecha_creacion.toISOString().split('T')[0];
      reservasEvolucion[dia] = (reservasEvolucion[dia] ?? 0) + 1;
    }
    const evolucionReservas = Object.entries(reservasEvolucion)
      .map(([fecha, total]) => ({ fecha, total }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    // ── 13. Evolución de pagos día a día ──────────────────────────────────────
    const pagosEvolucion: Record<string, number> = {};
    for (const p of pagosValidados) {
      const dia = p.fecha_creacion.toISOString().split('T')[0];
      pagosEvolucion[dia] = (pagosEvolucion[dia] ?? 0) + Number(p.monto);
    }
    const evolucionPagos = Object.entries(pagosEvolucion)
      .map(([fecha, monto]) => ({ fecha, monto }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    // ── 14. Cotizaciones por día de la semana ─────────────────────────────────
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const cotPorDia: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    for (const c of cotizaciones) {
      const dow = new Date(c.created_at).getDay();
      cotPorDia[dow] += 1;
    }
    const cotizacionesPorDia = diasSemana.map((nombre, i) => ({
      dia: nombre,
      dia_index: i,
      total: cotPorDia[i],
    }));

    // ── 15. Tours próximos a salir (30 días) ──────────────────────────────────
    const hoy = new Date();
    const en30Dias = new Date();
    en30Dias.setDate(hoy.getDate() + 30);

    const toursProximos = toursActivos
      .filter((t) => {
        if (!t.fecha_inicio) return false;
        const fi = new Date(t.fecha_inicio);
        return fi >= hoy && fi <= en30Dias;
      })
      .map((t) => {
        const ocupados = pasajerosPorTour[t.id] ?? 0;
        const cupos = t.cupos ?? 0;
        const disponibles = Math.max(0, cupos - ocupados);
        const porcentaje = cupos > 0 ? Math.round((ocupados / cupos) * 100) : 0;
        const diasRestantes = Math.ceil(
          (new Date(t.fecha_inicio!).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24),
        );
        return {
          tour_id: t.id,
          tour_nombre: t.nombre_tour,
          fecha_inicio: t.fecha_inicio,
          fecha_fin: t.fecha_fin,
          dias_restantes: diasRestantes,
          cupos_totales: cupos,
          cupos_ocupados: ocupados,
          cupos_disponibles: disponibles,
          porcentaje_ocupacion: porcentaje,
        };
      })
      .sort((a, b) => a.dias_restantes - b.dias_restantes);

    // ── 16. Tours con cupos críticos (>80%) ──────────────────────────────────
    const toursCuposCriticos = ocupacionPorTour
      .filter((t) => t.porcentaje_ocupacion >= 80)
      .sort((a, b) => b.porcentaje_ocupacion - a.porcentaje_ocupacion);

    // ── RESPUESTA ─────────────────────────────────────────────────────────────
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
        items: reservasTour.map((r) => {
          const pagadoReserva = pagosTour
            .filter((p) => p.reserva_id === r.id)
            .reduce((sum, p) => sum + Number(p.monto), 0);
          const saldo = Number(r.valor_total) - pagadoReserva;
          return {
            id: r.id,
            id_reserva: r.id_reserva,
            correo: r.correo,
            estado: r.estado,
            valor_total: Number(r.valor_total),
            total_pagado: pagadoReserva,
            saldo,
            responsable: r.responsable
              ? {
                  id: r.responsable.id,
                  nombre: r.responsable.nombre,
                  telefono: r.responsable.telefono,
                  documento: r.responsable.documento,
                }
              : null,
            integrantes_count: (r.integrantes?.length ?? 0) + 1,
            tour_nombre: r.tour?.nombre_tour ?? null,
            fecha_creacion: r.fecha_creacion,
          };
        }),
      },

      cotizaciones: {
        total: cotizaciones.length,
        items: cotizaciones.map((c) => ({
          id: c.id,
          nombre_completo: c.nombre_completo,
          detalles_plan: c.detalles_plan,
          numero_pasajeros: c.numero_pasajeros,
          origen: c.origen,
          destino: c.destino,
          created_at: c.created_at,
        })),
      },

      vuelos_por_agente: vuelosPorAgente,

      rendimiento_por_agente: rendimientoPorAgente,

      ingresos_por_tour: ingresosTour,

      tours_mas_vendidos: toursMasVendidos,

      destinos_mas_solicitados: destinosMasSolicitados,

      servicios_mas_contratados: serviciosMasContratados,

      ocupacion_por_tour: ocupacionPorTour,

      evolucion_reservas: evolucionReservas,

      evolucion_pagos: evolucionPagos,

      cotizaciones_por_dia: cotizacionesPorDia,

      tours_proximos: toursProximos,

      tours_cupos_criticos: toursCuposCriticos,

      respuestas_cotizacion: {
        total_en_periodo:              respuestasCotizacion.length,
        con_cotizacion:                respuestasConCotizacion.length,
        sin_cotizacion_no_plantilla:   respuestasSinCotizacionNoPl.length,
        leidas_por_cliente:            idsLeidas.size,
        porcentaje_leidas:             respuestasSinCotizacionNoPl.length
          ? Math.round((idsLeidas.size / respuestasSinCotizacionNoPl.length) * 100)
          : 0,
      },
    };
  }
}
