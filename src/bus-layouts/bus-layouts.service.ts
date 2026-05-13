import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusLayout } from './entities/bus-layout.entity';
import { CreateBusLayoutDto, UpdateBusLayoutDto } from './dto/create-bus-layout.dto';

@Injectable()
export class BusLayoutsService {
  constructor(
    @InjectRepository(BusLayout)
    private readonly repo: Repository<BusLayout>,
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

  // Cuenta solo asientos disponibles para clientes (tipo 'normal')
  private contarAsientosCliente(
    asientos: { tipo: string }[],
  ): number {
    const tiposNoCliente = new Set(['agente', 'conductor', 'vacio', 'baño', 'entrada']);
    return asientos.filter((a) => !tiposNoCliente.has(a.tipo)).length;
  }
}
