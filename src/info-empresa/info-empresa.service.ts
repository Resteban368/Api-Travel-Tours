import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InfoEmpresa } from './entities/info-empresa.entity';
import { CreateInfoEmpresaDto, UpdateInfoEmpresaDto } from './dto/info-empresa.dto';
import { N8nVector } from '../tours/entities/n8n-vector.entity';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { AuditoriaGeneralService } from '../auditoria-general/auditoria-general.service';

@Injectable()
export class InfoEmpresaService {
  constructor(
    @InjectRepository(InfoEmpresa)
    private readonly infoRepository: Repository<InfoEmpresa>,
    @InjectRepository(N8nVector)
    private readonly n8nVectorRepository: Repository<N8nVector>,
    private readonly embeddingsService: EmbeddingsService,
    private readonly auditoriaService: AuditoriaGeneralService,
  ) {}

  async create(dto: CreateInfoEmpresaDto, usuarioId?: number, usuarioNombre?: string): Promise<InfoEmpresa> {
    const count = await this.infoRepository.count();
    if (count > 0) {
      throw new BadRequestException(
        'Ya existe un registro de información de la empresa. Use PATCH para actualizar el registro existente.',
      );
    }
    const info = this.infoRepository.create(dto);
    const saved = await this.infoRepository.save(info);
    await this.syncInfoToVector();
    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'info-empresa',
      operacion: 'CREAR',
      documento_id: saved.id_info,
      detalle: { nombre: saved.nombre },
    });
    return saved;
  }

  async findAll(): Promise<InfoEmpresa[]> {
    return await this.infoRepository.find();
  }

  async findOne(id: number): Promise<InfoEmpresa> {
    const info = await this.infoRepository.findOne({
      where: { id_info: id },
    });
    if (!info) {
      throw new NotFoundException(`Información con ID ${id} no encontrada`);
    }
    return info;
  }

  async update(id: number, dto: UpdateInfoEmpresaDto, usuarioId?: number, usuarioNombre?: string): Promise<InfoEmpresa> {
    const info = await this.findOne(id);
    const antes = { nombre: info.nombre, direccion_sede_principal: info.direccion_sede_principal, telefono: info.telefono, correo: info.correo, pagina_web: info.pagina_web, nombre_gerente: info.nombre_gerente };
    Object.assign(info, dto);
    const saved = await this.infoRepository.save(info);
    await this.syncInfoToVector();
    const despues = { nombre: saved.nombre, direccion_sede_principal: saved.direccion_sede_principal, telefono: saved.telefono, correo: saved.correo, pagina_web: saved.pagina_web, nombre_gerente: saved.nombre_gerente };
    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'info-empresa',
      operacion: 'ACTUALIZAR',
      documento_id: id,
      detalle: { antes, despues },
    });
    return saved;
  }

  async remove(id: number, usuarioId?: number, usuarioNombre?: string): Promise<{ message: string }> {
    const info = await this.findOne(id);
    await this.infoRepository.remove(info);
    await this.syncInfoToVector();
    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'info-empresa',
      operacion: 'ELIMINAR',
      documento_id: id,
      detalle: { nombre: info.nombre },
    });
    return { message: `Información con ID ${id} eliminada` };
  }

  /**
   * Consolida toda la información de la empresa en un único vector.
   */
  async syncInfoToVector(): Promise<void> {
    const infos = await this.infoRepository.find();
    if (infos.length === 0) return;

    // Usualmente solo habrá una fila de info_empresa
    const info = infos[0];

    const socialMedia = Array.isArray(info.redes_sociales)
      ? info.redes_sociales.map((rs: any) => `${rs.name}: ${rs.link}`).join(', ')
      : '';

    const text = [
      `INFORMACIÓN CORPORATIVA: ${info.nombre}`,
      `Sede Principal: ${info.direccion_sede_principal}`,
      info.mision ? `Misión: ${info.mision}` : '',
      info.vision ? `Visión: ${info.vision}` : '',
      info.detalles_empresa ? `Sobre nosotros: ${info.detalles_empresa}` : '',
      info.horario_presencial ? `Horario Presencial: ${info.horario_presencial}` : '',
      info.horario_virtual ? `Horario Virtual: ${info.horario_virtual}` : '',
      socialMedia ? `Redes Sociales: ${socialMedia}` : '',
      info.nombre_gerente ? `Gerente: ${info.nombre_gerente}` : '',
      info.telefono ? `Teléfono: ${info.telefono}` : '',
      info.correo ? `Correo electrónico: ${info.correo}` : '',
      info.pagina_web ? `Sitio Web: ${info.pagina_web}` : '',
    ].filter(Boolean).join('\n');

    const fullText = `PERFIL COMPLETO DE LA EMPRESA:\n\n${text}`;

    // Generar embedding
    const embedding = await this.embeddingsService.embed(fullText);

    const metadata = {
      tipo: 'consolidado_info_empresa',
      fecha_modificacion: new Date().toISOString(),
    };

    // Buscar y actualizar o crear
    const existingVector = await this.n8nVectorRepository
      .createQueryBuilder('v')
      .where("v.metadata->>'tipo' = :tipo", { tipo: 'consolidado_info_empresa' })
      .getOne();

    if (existingVector) {
      existingVector.text = fullText;
      existingVector.embedding = embedding;
      existingVector.metadata = metadata;
      existingVector.modifiedTime = new Date();
      await this.n8nVectorRepository.save(existingVector);
    } else {
      const newVector = this.n8nVectorRepository.create({
        text: fullText,
        embedding,
        metadata,
        modifiedTime: new Date(),
      });
      await this.n8nVectorRepository.save(newVector);
    }
  }
}
