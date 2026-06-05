import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { BusLayout } from './entities/bus-layout.entity';
import { ToursMaestro } from '../tours/entities/tours-maestro.entity';
import { Reserva } from '../reservas/entities/reserva.entity';
import { AsientoSeleccionado } from '../seleccion-asientos/entities/asiento-seleccionado.entity';
import { CreateBusLayoutDto, UpdateBusLayoutDto } from './dto/create-bus-layout.dto';

@Injectable()
export class BusLayoutsService {
  constructor(
    @InjectRepository(BusLayout)
    private readonly repo: Repository<BusLayout>,
    @InjectRepository(ToursMaestro)
    private readonly toursRepo: Repository<ToursMaestro>,
    @InjectRepository(Reserva)
    private readonly reservaRepo: Repository<Reserva>,
    @InjectRepository(AsientoSeleccionado)
    private readonly asientoRepo: Repository<AsientoSeleccionado>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateBusLayoutDto): Promise<BusLayout> {
    const totalCliente = this.contarAsientosCliente(dto.configuracion.asientos);
    const layout = this.repo.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion ?? null,
      total_asientos_cliente: totalCliente,
      configuracion: dto.configuracion,
    });
    return this.repo.save(layout);
  }

  findAll(): Promise<BusLayout[]> {
    return this.repo.find({ where: { activo: true }, order: { created_at: 'DESC' } });
  }

  async findOne(id: number): Promise<BusLayout> {
    const layout = await this.repo.findOne({ where: { id } });
    if (!layout) throw new NotFoundException(`Bus layout con id ${id} no encontrado`);
    return layout;
  }

  async update(id: number, dto: UpdateBusLayoutDto): Promise<BusLayout> {
    const layout = await this.findOne(id);

    if (dto.configuracion) {
      layout.configuracion = dto.configuracion;
      layout.total_asientos_cliente = this.contarAsientosCliente(dto.configuracion.asientos);
    }
    if (dto.nombre !== undefined)      layout.nombre      = dto.nombre;
    if (dto.descripcion !== undefined) layout.descripcion = dto.descripcion ?? null;
    if (dto.activo !== undefined)      layout.activo      = dto.activo;

    return this.repo.save(layout);
  }

  async remove(id: number): Promise<{ ok: boolean }> {
    await this.findOne(id);
    await this.repo.update(id, { activo: false });
    return { ok: true };
  }

  async findHistorial(busId: number) {
    const bus = await this.findOne(busId);

    // Obtener tour IDs vinculados a este bus vía la tabla de unión
    const rows = await this.dataSource.query<{ tour_id: number }[]>(
      `SELECT tour_id FROM tour_bus_layouts WHERE bus_layout_id = $1`,
      [busId],
    );
    if (rows.length === 0) return [];

    const tourIds = rows.map((r) => r.tour_id);
    const tours = await this.toursRepo.findBy({ id: In(tourIds) });

    // Reservas activas de este bus en esos tours (excluye canceladas y eliminadas)
    const reservas = await this.reservaRepo.find({
      where: {
        tour: { id: In(tourIds) },
        bus_layout_id: busId,
        fecha_eliminacion: IsNull(),
      },
    });
    const reservasActivas = reservas.filter(
      (r) => !['cancelado', 'cancelada'].includes(r.estado?.toLowerCase() ?? ''),
    );

    // Asientos confirmados de estas reservas
    const reservaIds = reservasActivas.map((r) => r.id);
    const asientosMap = new Map<number, number>();
    if (reservaIds.length > 0) {
      const asientos = await this.asientoRepo.find({
        where: { reserva_id: In(reservaIds), estado: 'confirmado' },
      });
      for (const a of asientos) {
        asientosMap.set(a.reserva_id, (asientosMap.get(a.reserva_id) ?? 0) + 1);
      }
    }

    const resultado = tours.map((tour) => {
      const tourReservas = reservasActivas.filter((r) => r.tour?.id === tour.id);
      const totalReservas = tourReservas.length;
      const totalPasajeros = tourReservas.reduce(
        (sum, r) => sum + 1 + (r.integrantes?.filter((i) => i.ocupa_asiento !== false).length ?? 0),
        0,
      );
      const asientosOcupados = tourReservas.reduce(
        (sum, r) => sum + (asientosMap.get(r.id) ?? 0),
        0,
      );
      const asientosDisponibles = Math.max(0, bus.total_asientos_cliente - asientosOcupados);
      const porcentajeOcupacion =
        bus.total_asientos_cliente > 0
          ? Math.round((asientosOcupados / bus.total_asientos_cliente) * 100)
          : 0;

      return {
        tour_id: tour.id,
        nombre_tour: tour.nombre_tour,
        fecha_inicio: tour.fecha_inicio,
        fecha_fin: tour.fecha_fin,
        estado: tour.es_finalizado ? 'finalizado' : tour.is_active ? 'activo' : 'inactivo',
        total_reservas: totalReservas,
        total_pasajeros: totalPasajeros,
        asientos_ocupados: asientosOcupados,
        asientos_disponibles: asientosDisponibles,
        porcentaje_ocupacion: porcentajeOcupacion,
      };
    });

    resultado.sort((a, b) => {
      if (!a.fecha_inicio) return 1;
      if (!b.fecha_inicio) return -1;
      return new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime();
    });

    return resultado;
  }

  // Cuenta solo asientos disponibles para clientes (tipo 'normal')
  private contarAsientosCliente(
    asientos: { tipo: string }[],
  ): number {
    const tiposNoCliente = new Set(['agente', 'conductor', 'vacio', 'baño', 'entrada']);
    return asientos.filter((a) => !tiposNoCliente.has(a.tipo)).length;
  }
}
