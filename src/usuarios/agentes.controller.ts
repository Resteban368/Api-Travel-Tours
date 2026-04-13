import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Version,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * Gestión específica para Agentes (incluye permisos de módulos)
 * Solo accesible por Admin
 */
@Controller('agentes')
@Roles('admin')
export class AgentesController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Version('1')
  @Post()
  create(@Body() dto: CreateUsuarioDto) {
    dto.rol = 'agente';
    return this.usuariosService.create(dto);
  }

  @Version('1')
  @Get()
  findAll() {
    return this.usuariosService.findAllAgentesWithPermisos();
  }

  @Version('1')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.findAgenteWithPermisos(id);
  }

  @Version('1')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsuarioDto,
  ) {
    return this.usuariosService.update(id, dto);
  }

  @Version('1')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.remove(id);
  }
}
