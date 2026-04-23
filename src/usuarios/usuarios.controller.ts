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
  Req,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './entities/usuario.entity';

/** Gestión de usuarios — Protegido por roles */
@Controller('usuarios')
@Roles('admin')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Version('1')
  @Post()
  create(@Body() dto: CreateUsuarioDto, @Req() req: any) {
    return this.usuariosService.create(dto, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }

  @Version('1')
  @Post('agente')
  createAgente(@Body() dto: CreateUsuarioDto, @Req() req: any) {
    dto.rol = 'agente';
    return this.usuariosService.create(dto, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }

  @Version('1')
  @Get()
  findAll() {
    return this.usuariosService.findAll();
  }

  @Version('1')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.findOne(id);
  }

  @Version('1')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsuarioDto,
    @Req() req: any,
  ) {
    return this.usuariosService.update(id, dto, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }

  @Version('1')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.usuariosService.remove(id, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }
}
