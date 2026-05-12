import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository, SelectQueryBuilder } from 'typeorm';
import { Reserva } from '../reservas/entities/reserva.entity';
import { PagoRealizado } from '../pagos-realizados/entities/pago-realizado.entity';
import { RecordatorioLog } from '../recordatorio-saldo/entities/recordatorio-log.entity';
import { QuerySaldosDto } from './dto/query-saldos.dto';

const HAVING_SALDO =
  `(r.valor_total - COALESCE(SUM(CASE WHEN p.is_validated = true ` +
  `THEN CAST(p.monto AS numeric) ELSE 0 END), 0)) > 0`;

@Injectable()
export class SaldosPendientesService {
  constructor(
    @InjectRepository(Reserva)
    private readonly reservaRepo: Repository<Reserva>,
    @InjectRepository(PagoRealizado)
    private readonly pagoRepo: Repository<PagoRealizado>,
    @InjectRepository(RecordatorioLog)
    private readonly logRepo: Repository<RecordatorioLog>,
  ) {}

  async findSaldosPendientes(query: QuerySaldosDto) {
    const page   = Math.max(1, Number(query.page  ?? 1));
    const limit  = Math.min(Math.max(1, Number(query.limit ?? 20)), 100);
    const offset = (page - 1) * limit;

    const buildQb = (): SelectQueryBuilder<Reserva> => {
      const qb = this.reservaRepo
        .createQueryBuilder('r')
        .leftJoin('pagos_realizados', 'p',  'p.reserva_id = r.id')
        .leftJoin('clientes_app',     'cl', 'cl.id = r.id_responsable')
        .leftJoin('tours_maestro',    't',  't.id = r.id_tours')
        .where('r.fecha_eliminacion IS NULL')
        .andWhere("r.estado != 'cancelado'")
        .groupBy('r.id, cl.id, t.id')
        .having(HAVING_SALDO);

      if (query.tour_id) {
        qb.andWhere('t.id = :tourId', { tourId: Number(query.tour_id) });
      }
      if (query.id_reserva) {
        qb.andWhere('r.id_reserva ILIKE :idReserva', { idReserva: `%${query.id_reserva}%` });
      }
      if (query.responsable) {
        qb.andWhere('(cl.nombre ILIKE :resp OR cl.documento ILIKE :resp)', {
          resp: `%${query.responsable}%`,
        });
      }

      if (query.sin_recordatorio_reciente === 'true') {
        qb.andWhere(
          new Brackets((wb) => {
            wb.where((qbSub) => {
              const subQuery = qbSub
                .subQuery()
                .select('1')
                .from('recordatorios_log', 'rl')
                .where('rl.reserva_id = r.id')
                .andWhere("rl.estado = 'enviado'")
                .andWhere("rl.fecha_envio > (NOW() - INTERVAL '3 days')")
                .getQuery();
              return `NOT EXISTS ${subQuery}`;
            });
          }),
        );
      }

      return qb;
    };

    // Conteo total
    const countRows = await buildQb().select('r.id', 'id').getRawMany();
    const total = countRows.length;

    // Query de datos con selects, orden y paginación
    const rows = await buildQb()
      .select([
        'r.id                AS id',
        'r.id_reserva        AS id_reserva',
        'r.tipo_reserva      AS tipo_reserva',
        'r.estado            AS estado',
        'r.valor_total       AS valor_total',
        'r.fecha_creacion    AS fecha_creacion',
      ])
      .addSelect(
        `COALESCE(SUM(CASE WHEN p.is_validated = true
          THEN CAST(p.monto AS numeric) ELSE 0 END), 0)`,
        'total_pagado',
      )
      .addSelect(
        `MAX(CASE WHEN p.is_validated = true THEN p.fecha_creacion ELSE NULL END)`,
        'ultima_fecha_pago',
      )
      .addSelect('cl.id',             'responsable_id')
      .addSelect('cl.nombre',         'responsable_nombre')
      .addSelect('cl.documento',      'responsable_documento')
      .addSelect('cl.tipo_documento', 'responsable_tipo_documento')
      .addSelect('cl.telefono',       'responsable_telefono')
      .addSelect('cl.correo',         'responsable_correo')
      .addSelect('t.id',              'tour_id')
      .addSelect('t.nombre_tour',     'tour_nombre')
      .orderBy('ultima_fecha_pago', 'DESC', 'NULLS LAST')
      .offset(offset)
      .limit(limit)
      .getRawMany();

    if (rows.length === 0) return { total, page, limit, items: [] };

    const reservaIds = rows.map((r) => Number(r.id));

    // Pagos y recordatorios en paralelo
    const [pagos, logs] = await Promise.all([
      this.pagoRepo.find({
        where: { reserva_id: In(reservaIds) },
        order: { fecha_creacion: 'DESC' },
      }),
      this.logRepo.find({
        where: { reserva_id: In(reservaIds) },
        order: { fecha_envio: 'DESC' },
      }),
    ]);

    const pagosMap = new Map<number, PagoRealizado[]>();
    for (const pago of pagos) {
      if (!pagosMap.has(pago.reserva_id!)) pagosMap.set(pago.reserva_id!, []);
      pagosMap.get(pago.reserva_id!)!.push(pago);
    }

    // Agrupar logs por reserva_id
    const logsMap = new Map<number, RecordatorioLog[]>();
    for (const log of logs) {
      if (!logsMap.has(log.reserva_id)) logsMap.set(log.reserva_id, []);
      logsMap.get(log.reserva_id)!.push(log);
    }

    const items = rows.map((row) => {
      const valorTotal  = Number(row.valor_total);
      const totalPagado = Number(row.total_pagado);

      return {
        reserva_id:        Number(row.id),
        id_reserva:        row.id_reserva,
        tipo_reserva:      row.tipo_reserva,
        estado:            row.estado,
        fecha_creacion:    row.fecha_creacion,
        valor_total:       valorTotal,
        total_pagado:      totalPagado,
        saldo_pendiente:   Math.round((valorTotal - totalPagado) * 100) / 100,
        ultima_fecha_pago: row.ultima_fecha_pago ?? null,
        tour: row.tour_id
          ? { id: Number(row.tour_id), nombre: row.tour_nombre }
          : null,
        responsable: row.responsable_id
          ? {
              id:             Number(row.responsable_id),
              nombre:         row.responsable_nombre,
              documento:      row.responsable_documento,
              tipo_documento: row.responsable_tipo_documento,
              telefono:       row.responsable_telefono,
              correo:         row.responsable_correo,
            }
          : null,
        pagos: (pagosMap.get(Number(row.id)) ?? []).map((p) => ({
          id_pago:            p.id_pago,
          chat_id:            p.chat_id,
          monto:              Number(p.monto),
          metodo_pago:        p.metodo_pago,
          referencia:         p.referencia,
          fecha_documento:    p.fecha_documento,
          fecha_creacion:     p.fecha_creacion,
          proveedor_comercio: p.proveedor_comercio,
          is_validated:       p.is_validated,
          is_rechazado:       p.is_rechazado,
          motivo_rechazo:     p.motivo_rechazo,
          url_imagen:         p.url_imagen,
        })),
        recordatorios: (logsMap.get(Number(row.id)) ?? []).map((l) => ({
          id:                 l.id,
          estado:             l.estado,
          fecha_envio:        l.fecha_envio,
          enviado_por_nombre: l.enviado_por_nombre,
          error:              l.error,
        })),
        ultimo_recordatorio: logsMap.get(Number(row.id))?.[0]?.fecha_envio ?? null,
        total_recordatorios: logsMap.get(Number(row.id))?.length ?? 0,
      };
    });

    return { total, page, limit, items };
  }
}
