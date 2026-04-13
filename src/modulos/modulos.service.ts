import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Modulo } from './entities/modulo.entity';
import { CreateModuloDto } from './dto/create-modulo.dto';

const MODULOS_SEED: { nombre: string; descripcion: string }[] = [
  { nombre: 'dashboard', descripcion: 'Panel principal' },
  { nombre: 'tours', descripcion: 'Gestión de tours y paquetes de viaje' },
  { nombre: 'paymentMethods', descripcion: 'Métodos de pago disponibles' },
  { nombre: 'catalogues', descripcion: 'Catálogos generales' },
  { nombre: 'faqs', descripcion: 'Preguntas frecuentes' },
  { nombre: 'services', descripcion: 'Servicios adicionales' },
  { nombre: 'politicasReserva', descripcion: 'Políticas de reserva' },
  { nombre: 'infoEmpresa', descripcion: 'Información de la empresa' },
  { nombre: 'pagosRealizados', descripcion: 'Pagos realizados y validación' },
  { nombre: 'agentes', descripcion: 'Gestión de agentes' },
  { nombre: 'reservas', descripcion: 'Gestión de reservas' },
];

@Injectable()
export class ModulosService implements OnModuleInit {
  constructor(
    @InjectRepository(Modulo)
    private readonly moduloRepo: Repository<Modulo>,
  ) {}

  async onModuleInit() {
    for (const m of MODULOS_SEED) {
      const exists = await this.moduloRepo.findOne({ where: { nombre: m.nombre } });
      if (!exists) {
        await this.moduloRepo.save(
          this.moduloRepo.create({ ...m, estado: true }),
        );
      }
    }
  }

  findAll() {
    return this.moduloRepo.find({ order: { nombre: 'ASC' } });
  }

  async findOne(id: number) {
    const modulo = await this.moduloRepo.findOne({ where: { id } });
    if (!modulo) throw new NotFoundException(`Módulo con ID ${id} no encontrado`);
    return modulo;
  }

  async create(dto: CreateModuloDto) {
    const modulo = this.moduloRepo.create({ ...dto, estado: dto.estado ?? true });
    return this.moduloRepo.save(modulo);
  }

  async update(id: number, dto: Partial<CreateModuloDto>) {
    const modulo = await this.findOne(id);
    Object.assign(modulo, dto);
    return this.moduloRepo.save(modulo);
  }

  async remove(id: number) {
    const modulo = await this.findOne(id);
    await this.moduloRepo.remove(modulo);
    return { message: `Módulo con ID ${id} eliminado` };
  }
}
