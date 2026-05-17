import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Proveedor } from './entities/proveedor.entity';
import { CreateProveedorDto, UpdateProveedorDto } from './dto/create-proveedor.dto';
import { AuditoriaGeneralService } from '../auditoria-general/auditoria-general.service';

@Injectable()
export class ProveedoresService {
  constructor(
    @InjectRepository(Proveedor)
    private readonly repo: Repository<Proveedor>,
    private readonly auditoriaService: AuditoriaGeneralService,
  ) {}

  async create(dto: CreateProveedorDto, usuarioId?: number, usuarioNombre?: string) {
    const proveedor = this.repo.create({ ...dto });
    const saved = await this.repo.save(proveedor);
    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'proveedores',
      operacion: 'CREAR',
      documento_id: saved.id,
      detalle: { nombre: saved.nombre, tipo: saved.tipo },
    });
    return saved;
  }

  async findAll(page = 1, limit = 20, search?: string) {
    const where: any = { is_active: true };
    if (search) where.nombre = ILike(`%${search}%`);
    const [data, total] = await this.repo.findAndCount({
      where,
      order: { nombre: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const proveedor = await this.repo.findOne({ where: { id, is_active: true } });
    if (!proveedor) throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
    return proveedor;
  }

  async update(id: number, dto: UpdateProveedorDto, usuarioId?: number, usuarioNombre?: string) {
    const proveedor = await this.findOne(id);
    const antes = { nombre: proveedor.nombre, tipo: proveedor.tipo };
    Object.assign(proveedor, dto);
    const saved = await this.repo.save(proveedor);
    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'proveedores',
      operacion: 'ACTUALIZAR',
      documento_id: id,
      detalle: { antes, despues: { nombre: saved.nombre, tipo: saved.tipo } },
    });
    return saved;
  }

  async remove(id: number, usuarioId?: number, usuarioNombre?: string) {
    const proveedor = await this.findOne(id);
    proveedor.is_active = false;
    await this.repo.save(proveedor);
    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'proveedores',
      operacion: 'ELIMINAR',
      documento_id: id,
      detalle: { nombre: proveedor.nombre },
    });
    return { ok: true };
  }
}
