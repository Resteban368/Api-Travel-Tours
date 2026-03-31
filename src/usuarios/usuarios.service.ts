import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
  ) {}

  // ─── INTERNO: buscar por email (usado por AuthService) ────────────────────

  async findByEmail(email: string): Promise<Usuario | null> {
    return this.usuariosRepository.findOne({ where: { email } });
  }

  async findById(id: number): Promise<Usuario | null> {
    return this.usuariosRepository.findOne({ where: { id_usuario: id } });
  }

  // ─── INTERNO: actualizar refresh token hash ────────────────────────────────

  async updateRefreshToken(
    id: number,
    tokenHash: string | null,
  ): Promise<void> {
    await this.usuariosRepository.update(id, { refresh_token_hash: tokenHash });
  }

  async updateUltimoAcceso(id: number): Promise<void> {
    await this.usuariosRepository.update(id, { ultimo_acceso: new Date() });
  }

  // ─── CRUD (solo admin) ────────────────────────────────────────────────────

  async create(dto: CreateUsuarioDto): Promise<Omit<Usuario, 'password_hash' | 'refresh_token_hash'>> {
    const exists = await this.findByEmail(dto.email);
    if (exists) {
      throw new ConflictException(`Ya existe un usuario con el email ${dto.email}`);
    }

    const password_hash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const usuario = this.usuariosRepository.create({
      nombre: dto.nombre,
      email: dto.email,
      password_hash,
      rol: dto.rol ?? 'agente',
      activo: dto.activo ?? true,
    });

    const saved = await this.usuariosRepository.save(usuario);
    return this.sanitize(saved);
  }

  async findAll(): Promise<Omit<Usuario, 'password_hash' | 'refresh_token_hash'>[]> {
    const usuarios = await this.usuariosRepository.find({
      order: { fecha_creacion: 'DESC' },
    });
    return usuarios.map(this.sanitize);
  }

  async findOne(id: number): Promise<Omit<Usuario, 'password_hash' | 'refresh_token_hash'>> {
    const usuario = await this.findById(id);
    if (!usuario) throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    return this.sanitize(usuario);
  }

  async update(id: number, dto: UpdateUsuarioDto): Promise<Omit<Usuario, 'password_hash' | 'refresh_token_hash'>> {
    const usuario = await this.findById(id);
    if (!usuario) throw new NotFoundException(`Usuario con ID ${id} no encontrado`);

    if (dto.email && dto.email !== usuario.email) {
      const exists = await this.findByEmail(dto.email);
      if (exists) throw new ConflictException(`Ya existe un usuario con el email ${dto.email}`);
    }

    Object.assign(usuario, dto);
    const saved = await this.usuariosRepository.save(usuario);
    return this.sanitize(saved);
  }

  async remove(id: number): Promise<{ message: string }> {
    const usuario = await this.findById(id);
    if (!usuario) throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    await this.usuariosRepository.remove(usuario);
    return { message: `Usuario con ID ${id} eliminado` };
  }

  // Quita campos sensibles de la respuesta
  private sanitize(usuario: Usuario): Omit<Usuario, 'password_hash' | 'refresh_token_hash'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, refresh_token_hash, ...rest } = usuario;
    return rest;
  }
}
