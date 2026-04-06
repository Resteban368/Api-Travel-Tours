import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Version } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from './entities/rol.entity';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('roles')
@Roles('admin')
export class RolesController {
  constructor(
    @InjectRepository(Rol)
    private readonly rolesRepository: Repository<Rol>,
  ) {}

  @Version('1')
  @Post()
  create(@Body() dto: { nombre: string; descripcion?: string }) {
    return this.rolesRepository.save(this.rolesRepository.create(dto));
  }

  @Version('1')
  @Get()
  findAll() {
    return this.rolesRepository.find();
  }

  @Version('1')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesRepository.findOne({ where: { id_rol: id } });
  }

  @Version('1')
  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<Rol>) {
    await this.rolesRepository.update(id, dto);
    return this.rolesRepository.findOne({ where: { id_rol: id } });
  }

  @Version('1')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.rolesRepository.delete(id);
    return { message: `Rol con ID ${id} eliminado` };
  }
}
