import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Catalogo } from './entities/catalogo.entity';
import { CreateCatalogoDto } from './dto/create-catalogo.dto';
import { UpdateCatalogoDto } from './dto/update-catalogo.dto';

@Injectable()
export class CatalogosService {
  constructor(
    @InjectRepository(Catalogo)
    private readonly catalogosRepository: Repository<Catalogo>,
  ) {}

  async create(createCatalogoDto: CreateCatalogoDto): Promise<Catalogo> {
    const catalogo = this.catalogosRepository.create({
      id_sede: createCatalogoDto.id_sede,
      nombre_catalogo: createCatalogoDto.nombre_catalogo,
      url_archivo: createCatalogoDto.url_archivo,
      activo: createCatalogoDto.activo ?? true,
    });
    return await this.catalogosRepository.save(catalogo);
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
  ): Promise<Catalogo> {
    const catalogo = await this.findOne(id);

    if (updateCatalogoDto.id_sede !== undefined)
      catalogo.id_sede = updateCatalogoDto.id_sede;
    if (updateCatalogoDto.nombre_catalogo !== undefined)
      catalogo.nombre_catalogo = updateCatalogoDto.nombre_catalogo;
    if (updateCatalogoDto.url_archivo !== undefined)
      catalogo.url_archivo = updateCatalogoDto.url_archivo;
    if (updateCatalogoDto.activo !== undefined)
      catalogo.activo = updateCatalogoDto.activo;

    return await this.catalogosRepository.save(catalogo);
  }

  async remove(id: number): Promise<{ message: string }> {
    const catalogo = await this.findOne(id);
    await this.catalogosRepository.remove(catalogo);
    return { message: `Catálogo con ID ${id} eliminado correctamente` };
  }
}
