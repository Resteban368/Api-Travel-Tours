import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Opinion } from './entities/opinion.entity';
import { CreateOpinionPublicaDto, UpdateOpinionDto } from './dto/opiniones.dto';
import { AuditoriaGeneralService } from '../auditoria-general/auditoria-general.service';

const CACHE_KEY = 'integracion:opiniones';
const CACHE_TTL = 5 * 60 * 1000; // 5 min
const REVALIDATE_URL_DEFAULT = 'https://www.travelclubagencia.com/api/revalidate';

export interface OpinionPublica {
  id: number;
  nombre: string;
  plan: string | null;
  opinion: string;
  calificacion: number;
  fecha_creacion: Date;
}

@Injectable()
export class OpinionesService {
  private readonly logger = new Logger(OpinionesService.name);

  constructor(
    @InjectRepository(Opinion)
    private readonly opinionRepository: Repository<Opinion>,
    private readonly auditoriaService: AuditoriaGeneralService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  // ── Web pública ────────────────────────────────────────────────────────────

  async crearDesdeWeb(dto: CreateOpinionPublicaDto): Promise<{ ok: true }> {
    await this.opinionRepository.save(
      this.opinionRepository.create({
        nombre: dto.nombre,
        plan: dto.plan || null,
        texto: dto.opinion,
        estrellas: dto.calificacion ?? 5,
        aprobada: false,
      }),
    );
    return { ok: true };
  }

  async findAprobadas(): Promise<OpinionPublica[]> {
    const cached = await this.cacheManager.get<OpinionPublica[]>(CACHE_KEY);
    if (cached) return cached;

    const opiniones = await this.opinionRepository.find({
      where: { aprobada: true },
      order: { fecha_creacion: 'DESC' },
      take: 100,
    });

    const result = opiniones.map((o) => ({
      id: o.id_opinion,
      nombre: o.nombre,
      plan: o.plan,
      opinion: o.texto,
      calificacion: o.estrellas,
      fecha_creacion: o.fecha_creacion,
    }));
    await this.cacheManager.set(CACHE_KEY, result, CACHE_TTL);
    return result;
  }

  // ── Administración ─────────────────────────────────────────────────────────

  findAll(aprobada?: boolean): Promise<Opinion[]> {
    return this.opinionRepository.find({
      where: aprobada === undefined ? {} : { aprobada },
      order: { fecha_creacion: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Opinion> {
    const opinion = await this.opinionRepository.findOne({ where: { id_opinion: id } });
    if (!opinion) throw new NotFoundException(`Opinión con ID ${id} no encontrada`);
    return opinion;
  }

  async update(id: number, dto: UpdateOpinionDto, usuarioId?: number, usuarioNombre?: string): Promise<Opinion> {
    const opinion = await this.findOne(id);
    opinion.aprobada = dto.aprobada;
    const saved = await this.opinionRepository.save(opinion);
    await this.cacheManager.del(CACHE_KEY);
    await this.revalidarWeb();
    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'opiniones',
      operacion: 'ACTUALIZAR',
      documento_id: saved.id_opinion,
      detalle: { nombre: saved.nombre, aprobada: saved.aprobada },
    });
    return saved;
  }

  async remove(id: number, usuarioId?: number, usuarioNombre?: string): Promise<{ deleted: true }> {
    const opinion = await this.findOne(id);
    await this.opinionRepository.remove(opinion);
    await this.cacheManager.del(CACHE_KEY);
    if (opinion.aprobada) await this.revalidarWeb();
    await this.auditoriaService.registrar({
      usuario_id: usuarioId ?? null,
      usuario_nombre: usuarioNombre ?? null,
      modulo: 'opiniones',
      operacion: 'ELIMINAR',
      documento_id: id,
      detalle: { nombre: opinion.nombre },
    });
    return { deleted: true };
  }

  // Avisa a la web para que refresque la lista de opiniones publicadas.
  // Si falla solo se registra: la web igual se actualiza al vencer su caché.
  private async revalidarWeb(): Promise<void> {
    const secret = this.configService.get<string>('REVALIDATE_SECRET');
    if (!secret) {
      this.logger.warn('REVALIDATE_SECRET no configurado; no se avisó a la web');
      return;
    }
    const url = this.configService.get<string>('WEB_REVALIDATE_URL') || REVALIDATE_URL_DEFAULT;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({ tags: ['opiniones'] }),
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) this.logger.warn(`Revalidación de la web respondió ${response.status}`);
    } catch (error) {
      this.logger.warn(`No se pudo revalidar la web: ${(error as Error).message}`);
    }
  }
}
