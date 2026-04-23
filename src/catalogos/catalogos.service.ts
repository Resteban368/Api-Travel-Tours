import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Catalogo } from './entities/catalogo.entity';
import { CreateCatalogoDto } from './dto/create-catalogo.dto';
import { UpdateCatalogoDto } from './dto/update-catalogo.dto';
import { AuditoriaGeneralService } from '../auditoria-general/auditoria-general.service';

@Injectable()
export class CatalogosService {
  constructor(
    @InjectRepository(Catalogo)
    private readonly catalogosRepository: Repository<Catalogo>,
    private readonly auditoriaService: AuditoriaGeneralService,
  ) {}

  async create(createCatalogoDto: CreateCatalogoDto, usuarioId?: number, usuarioNombre?: string): Promise<Catalogo> {
    const catalogo = this.catalogosRepository.create({
      id_sede: createCatalogoDto.id_sede,
      nombre_catalogo: createCatalogoDto.nombre_catalogo,
      url_archivo: createCatalogoDto.url_archivo,
      activo: createCatalogoDto.activo ?? true,
    });
    const saved = await this.catalogosRepository.save(catalogo);
    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'catalogos',
      operacion: 'CREAR',
      documento_id: saved.id_catalogo,
      detalle: { nombre_catalogo: saved.nombre_catalogo, id_sede: saved.id_sede },
    });
    return saved;
  }

  async findAll(): Promise<Catalogo[]> {
    return await this.catalogosRepository.find({
      order: { id_catalogo: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Catalogo> {
    const catalogo = await this.catalogosRepository.findOne({
      where: { id_catalogo: id },
    });
    if (!catalogo) {
      throw new NotFoundException(`Catálogo con ID ${id} no encontrado`);
    }
    return catalogo;
  }

  async update(
    id: number,
    updateCatalogoDto: UpdateCatalogoDto,
    usuarioId?: number,
    usuarioNombre?: string,
  ): Promise<Catalogo> {
    const catalogo = await this.findOne(id);
    const antes = { nombre_catalogo: catalogo.nombre_catalogo, id_sede: catalogo.id_sede, url_archivo: catalogo.url_archivo, activo: catalogo.activo };

    if (updateCatalogoDto.id_sede !== undefined)
      catalogo.id_sede = updateCatalogoDto.id_sede;
    if (updateCatalogoDto.nombre_catalogo !== undefined)
      catalogo.nombre_catalogo = updateCatalogoDto.nombre_catalogo;
    if (updateCatalogoDto.url_archivo !== undefined)
      catalogo.url_archivo = updateCatalogoDto.url_archivo;
    if (updateCatalogoDto.activo !== undefined)
      catalogo.activo = updateCatalogoDto.activo;

    const saved = await this.catalogosRepository.save(catalogo);
    const despues = { nombre_catalogo: saved.nombre_catalogo, id_sede: saved.id_sede, url_archivo: saved.url_archivo, activo: saved.activo };
    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'catalogos',
      operacion: 'ACTUALIZAR',
      documento_id: id,
      detalle: { antes, despues },
    });
    return saved;
  }

  async remove(id: number, usuarioId?: number, usuarioNombre?: string): Promise<{ message: string }> {
    const catalogo = await this.findOne(id);
    await this.catalogosRepository.remove(catalogo);
    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'catalogos',
      operacion: 'ELIMINAR',
      documento_id: id,
      detalle: { nombre_catalogo: catalogo.nombre_catalogo },
    });
    return { message: `Catálogo con ID ${id} eliminado correctamente` };
  }
}
