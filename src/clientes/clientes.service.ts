import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ClienteApp } from './entities/cliente-app.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { AuditoriaGeneralService } from '../auditoria-general/auditoria-general.service';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(ClienteApp)
    private readonly clientesRepository: Repository<ClienteApp>,
    private readonly auditoriaService: AuditoriaGeneralService,
  ) {}

  async create(dto: CreateClienteDto, usuarioId?: number, usuarioNombre?: string): Promise<any> {
    if (dto.documento) {
      const existingCliente = await this.clientesRepository.findOne({
        where: { documento: dto.documento },
      });

      if (existingCliente) {
        if (existingCliente.deleted_at !== null) {
          // Reactivación
          const antes = { nombre: existingCliente.nombre, documento: existingCliente.documento, estado: existingCliente.estado, deleted_at: existingCliente.deleted_at };
          existingCliente.nombre = dto.nombre;
          existingCliente.telefono = dto.telefono ?? existingCliente.telefono;
          existingCliente.fecha_nacimiento = dto.fecha_nacimiento ?? existingCliente.fecha_nacimiento;
          existingCliente.tipo_documento = dto.tipo_documento ?? existingCliente.tipo_documento;
          existingCliente.correo = dto.correo ?? existingCliente.correo;
          existingCliente.estado = true;
          existingCliente.deleted_at = null;

          const saved = await this.clientesRepository.save(existingCliente);
          const despues = { nombre: saved.nombre, documento: saved.documento, estado: saved.estado, deleted_at: saved.deleted_at };
          await this.auditoriaService.registrar({
            usuario_id: usuarioId ?? null,
            usuario_nombre: usuarioNombre ?? null,
            modulo: 'clientes',
            operacion: 'ACTUALIZAR',
            documento_id: saved.id,
            detalle: { antes, despues, accion: 'reactivacion' },
          });
          return {
            message: 'Cliente reactivado exitosamente',
            data: saved,
          };
        } else {
          throw new BadRequestException('El cliente ya se encuentra registrado');
        }
      }
    }

    const cliente = this.clientesRepository.create({
      nombre: dto.nombre,
      telefono: dto.telefono ?? null,
      fecha_nacimiento: dto.fecha_nacimiento ?? null,
      tipo_documento: dto.tipo_documento ?? null,
      documento: dto.documento ?? null,
      correo: dto.correo ?? null,
      estado: dto.estado ?? true,
    });
    const saved = await this.clientesRepository.save(cliente);
    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'clientes',
      operacion: 'CREAR',
      documento_id: saved.id,
      detalle: { nombre: saved.nombre, documento: saved.documento, correo: saved.correo },
    });
    return saved;
  }

  async findAll(page = 1, limit = 20) {
    const [data, total] = await this.clientesRepository.findAndCount({
      where: { deleted_at: IsNull() },
      order: { fecha_creacion: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number): Promise<ClienteApp> {
    const cliente = await this.clientesRepository.findOne({ where: { id } });
    if (!cliente) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }
    return cliente;
  }

  async update(id: number, dto: UpdateClienteDto, usuarioId?: number, usuarioNombre?: string): Promise<ClienteApp> {
    const cliente = await this.findOne(id);
    const antes = { nombre: cliente.nombre, telefono: cliente.telefono, fecha_nacimiento: cliente.fecha_nacimiento, tipo_documento: cliente.tipo_documento, documento: cliente.documento, correo: cliente.correo, estado: cliente.estado };

    if (dto.nombre !== undefined) cliente.nombre = dto.nombre;
    if (dto.telefono !== undefined) cliente.telefono = dto.telefono;
    if (dto.fecha_nacimiento !== undefined) cliente.fecha_nacimiento = dto.fecha_nacimiento;
    if (dto.tipo_documento !== undefined) cliente.tipo_documento = dto.tipo_documento;
    if (dto.documento !== undefined) cliente.documento = dto.documento;
    if (dto.correo !== undefined) cliente.correo = dto.correo;
    if (dto.estado !== undefined) cliente.estado = dto.estado;

    const saved = await this.clientesRepository.save(cliente);
    const despues = { nombre: saved.nombre, telefono: saved.telefono, fecha_nacimiento: saved.fecha_nacimiento, tipo_documento: saved.tipo_documento, documento: saved.documento, correo: saved.correo, estado: saved.estado };
    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'clientes',
      operacion: 'ACTUALIZAR',
      documento_id: id,
      detalle: { antes, despues },
    });
    return saved;
  }

  async remove(id: number, usuarioId?: number, usuarioNombre?: string): Promise<{ message: string }> {
    const cliente = await this.findOne(id);
    cliente.estado = false;
    cliente.deleted_at = new Date();
    await this.clientesRepository.save(cliente);
    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'clientes',
      operacion: 'ELIMINAR',
      documento_id: id,
      detalle: { nombre: cliente.nombre, documento: cliente.documento },
    });
    return { message: `Cliente con ID ${id} eliminado correctamente` };
  }
}
