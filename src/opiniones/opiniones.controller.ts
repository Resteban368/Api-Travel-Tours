import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  ParseBoolPipe,
  Query,
  Req,
} from '@nestjs/common';
import { OpinionesService } from './opiniones.service';
import { UpdateOpinionDto } from './dto/opiniones.dto';
import { RequierePermiso } from '../modulos/decorators/requiere-permiso.decorator';

@Controller('opiniones')
@RequierePermiso('opiniones')
export class OpinionesController {
  constructor(private readonly opinionesService: OpinionesService) {}

  @Get()
  findAll(@Query('aprobada', new ParseBoolPipe({ optional: true })) aprobada?: boolean) {
    return this.opinionesService.findAll(aprobada);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.opinionesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateOpinionDto,
    @Req() req: any,
  ) {
    return this.opinionesService.update(id, updateDto, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.opinionesService.remove(id, req.user?.id_usuario, req.user?.nombre || req.user?.email);
  }
}
