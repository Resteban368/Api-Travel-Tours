import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { AuditoriaGeneral } from './entities/auditoria-general.entity';

export type Operacion = 'CREAR' | 'ACTUALIZAR' | 'ELIMINAR';

export interface RegistrarAuditoriaDto {
  usuario_id?: number | null;
  usuario_nombre?: string | null;
  modulo: string;
  operacion: Operacion;
  documento_id?: string | number | null;
  detalle?: Record<string, any> | null;
}

@Injectable()
export class AuditoriaGeneralService {
  constructor(
    @InjectRepository(AuditoriaGeneral)
    private readonly auditoriaRepository: Repository<AuditoriaGeneral>,
  ) {}

  async registrar(dto: RegistrarAuditoriaDto): Promise<void> {
    await this.auditoriaRepository.insert({
      usuario_id: dto.usuario_id ?? null,
      usuario_nombre: dto.usuario_nombre ?? null,
      modulo: dto.modulo,
      operacion: dto.operacion,
      documento_id: dto.documento_id != null ? String(dto.documento_id) : null,
      detalle: dto.detalle ?? null,
    });
  }

  async consultar(params: {
    modulo?: string;
    operacion?: string;
    usuario_id?: number;
    fecha?: string;
    page?: number;
    limit?: number;
  }) {
    const { modulo, operacion, usuario_id, fecha, page = 1, limit = 50 } = params;

    const qb = this.auditoriaRepository
      .createQueryBuilder('a')
      .orderBy('a.fecha', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (modulo) qb.andWhere('a.modulo = :modulo', { modulo });
    if (operacion) qb.andWhere('a.operacion = :operacion', { operacion });
    if (usuario_id) qb.andWhere('a.usuario_id = :usuario_id', { usuario_id });

    if (fecha) {
      const inicio = new Date(`${fecha}T00:00:00.000Z`);
      const fin = new Date(`${fecha}T23:59:59.999Z`);
      qb.andWhere('a.fecha BETWEEN :inicio AND :fin', { inicio, fin });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
