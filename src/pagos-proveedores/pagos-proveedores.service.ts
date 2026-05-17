import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PagoProveedor } from './entities/pago-proveedor.entity';
import { Proveedor } from '../proveedores/entities/proveedor.entity';
import { ToursMaestro } from '../tours/entities/tours-maestro.entity';
import { Hotel } from '../hoteles/entities/hotel.entity';
import { MetodoPago } from '../metodos-pago/entities/metodo-pago.entity';
import { CreatePagoProveedorDto, UpdatePagoProveedorDto } from './dto/create-pago-proveedor.dto';
import { AuditoriaGeneralService } from '../auditoria-general/auditoria-general.service';

@Injectable()
export class PagosProveedoresService {
  constructor(
    @InjectRepository(PagoProveedor)
    private readonly repo: Repository<PagoProveedor>,
    @InjectRepository(Proveedor)
    private readonly proveedorRepo: Repository<Proveedor>,
    @InjectRepository(ToursMaestro)
    private readonly tourRepo: Repository<ToursMaestro>,
    @InjectRepository(Hotel)
    private readonly hotelRepo: Repository<Hotel>,
    @InjectRepository(MetodoPago)
    private readonly metodoPagoRepo: Repository<MetodoPago>,
    private readonly auditoriaService: AuditoriaGeneralService,
  ) {}

  async create(dto: CreatePagoProveedorDto, usuarioId?: number, usuarioNombre?: string) {
    await this.validarRelaciones(dto);

    const pago = this.repo.create({
      proveedor_id: dto.proveedor_id,
      tour_id: dto.tour_id ?? null,
      hotel_id: dto.hotel_id ?? null,
      concepto: dto.concepto,
      monto: dto.monto,
      moneda: dto.moneda ?? 'COP',
      fecha_pago: dto.fecha_pago,
      metodo_pago_id: dto.metodo_pago_id ?? null,
      comprobante_url: dto.comprobante_url ?? null,
      notas: dto.notas ?? null,
      creado_por_id: usuarioId ?? null,
      creado_por_nombre: usuarioNombre ?? null,
    });

    const saved = await this.repo.save(pago);

    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'pagos-proveedores',
      operacion: 'CREAR',
      documento_id: saved.id,
      detalle: { proveedor_id: saved.proveedor_id, monto: saved.monto, moneda: saved.moneda },
    });

    return this.findOne(saved.id);
  }

  async findAll(filters: {
    proveedor_id?: number;
    tour_id?: number;
    hotel_id?: number;
    moneda?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    page?: number;
    limit?: number;
  }) {
    const { proveedor_id, tour_id, hotel_id, moneda, fecha_desde, fecha_hasta, page = 1, limit = 20 } = filters;

    const qb = this.repo.createQueryBuilder('p')
      .leftJoinAndSelect('p.proveedor', 'proveedor')
      .leftJoinAndSelect('p.tour', 'tour')
      .leftJoinAndSelect('p.hotel', 'hotel')
      .leftJoinAndSelect('p.metodo_pago', 'metodo_pago')
      .where('p.is_active = true')
      .orderBy('p.fecha_pago', 'DESC')
      .addOrderBy('p.created_at', 'DESC');

    if (proveedor_id) qb.andWhere('p.proveedor_id = :proveedor_id', { proveedor_id });
    if (tour_id) qb.andWhere('p.tour_id = :tour_id', { tour_id });
    if (hotel_id) qb.andWhere('p.hotel_id = :hotel_id', { hotel_id });
    if (moneda) qb.andWhere('p.moneda = :moneda', { moneda });
    if (fecha_desde) qb.andWhere('p.fecha_pago >= :fecha_desde', { fecha_desde });
    if (fecha_hasta) qb.andWhere('p.fecha_pago <= :fecha_hasta', { fecha_hasta });

    const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const pago = await this.repo.findOne({
      where: { id, is_active: true },
      relations: ['proveedor', 'tour', 'hotel', 'metodo_pago'],
    });
    if (!pago) throw new NotFoundException(`Pago a proveedor con ID ${id} no encontrado`);
    return pago;
  }

  async update(id: number, dto: UpdatePagoProveedorDto, usuarioId?: number, usuarioNombre?: string) {
    const pago = await this.findOne(id);
    await this.validarRelaciones(dto);

    const antes = { monto: pago.monto, moneda: pago.moneda, concepto: pago.concepto };
    Object.assign(pago, {
      ...dto,
      tour_id: dto.tour_id !== undefined ? (dto.tour_id ?? null) : pago.tour_id,
      hotel_id: dto.hotel_id !== undefined ? (dto.hotel_id ?? null) : pago.hotel_id,
      metodo_pago_id: dto.metodo_pago_id !== undefined ? (dto.metodo_pago_id ?? null) : pago.metodo_pago_id,
    });

    const saved = await this.repo.save(pago);

    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'pagos-proveedores',
      operacion: 'ACTUALIZAR',
      documento_id: id,
      detalle: { antes, despues: { monto: saved.monto, moneda: saved.moneda, concepto: saved.concepto } },
    });

    return this.findOne(id);
  }

  async remove(id: number, usuarioId?: number, usuarioNombre?: string) {
    const pago = await this.findOne(id);
    pago.is_active = false;
    await this.repo.save(pago);

    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'pagos-proveedores',
      operacion: 'ELIMINAR',
      documento_id: id,
      detalle: { concepto: pago.concepto, monto: pago.monto },
    });

    return { ok: true };
  }

  private async validarRelaciones(dto: Partial<CreatePagoProveedorDto>) {
    if (dto.tour_id && dto.hotel_id) {
      throw new BadRequestException('Un pago solo puede estar vinculado a un tour O a un hotel, no a ambos');
    }

    if (dto.proveedor_id) {
      const proveedor = await this.proveedorRepo.findOne({ where: { id: dto.proveedor_id, is_active: true } });
      if (!proveedor) throw new NotFoundException(`Proveedor con ID ${dto.proveedor_id} no encontrado`);
    }

    if (dto.tour_id) {
      const tour = await this.tourRepo.findOne({ where: { id: dto.tour_id } });
      if (!tour) throw new NotFoundException(`Tour con ID ${dto.tour_id} no encontrado`);
    }

    if (dto.hotel_id) {
      const hotel = await this.hotelRepo.findOne({ where: { id: dto.hotel_id } });
      if (!hotel) throw new NotFoundException(`Hotel con ID ${dto.hotel_id} no encontrado`);
    }

    if (dto.metodo_pago_id) {
      const metodo = await this.metodoPagoRepo.findOne({ where: { id_metodo_pago: dto.metodo_pago_id } });
      if (!metodo) throw new NotFoundException(`Método de pago con ID ${dto.metodo_pago_id} no encontrado`);
    }
  }
}
