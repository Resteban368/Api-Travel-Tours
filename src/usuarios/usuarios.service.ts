import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario, UserRole } from './entities/usuario.entity';
import { Rol } from './entities/rol.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
    @InjectRepository(Rol)
    private readonly rolesRepository: Repository<Rol>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedAdmin();
  }

  private async seedAdmin() {
    const adminEmail = this.configService.get<string>('SEED_ADMIN_EMAIL');
    const adminPassword = this.configService.get<string>('SEED_ADMIN_PASSWORD');

    if (!adminEmail || !adminPassword) return;

    const exists = await this.findByEmail(adminEmail);
    if (exists) return;

    console.log('Seeding initial admin user...');

    // Asegurar que el rol 'admin' exista
    let rolAdmin = await this.rolesRepository.findOne({ where: { nombre: 'admin' } });
    if (!rolAdmin) {
      rolAdmin = await this.rolesRepository.save(this.rolesRepository.create({ nombre: 'admin' }));
    }

    const password_hash = await bcrypt.hash(adminPassword, BCRYPT_ROUNDS);

    const admin = this.usuariosRepository.create({
      nombre: 'Administrador Sistema',
      email: adminEmail,
      password_hash,
      rol: rolAdmin,
      rol_nombre: 'admin',
      activo: true,
    });

    await this.usuariosRepository.save(admin);
    console.log('Admin user seeded successfully.');
  }

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

    const roleName = dto.rol ?? 'agente';
    let rol = await this.rolesRepository.findOne({ where: { nombre: roleName } });

    // Si el rol no existe, lo creamos (esto asegura que 'admin' y 'agente' existan)
    if (!rol) {
      rol = await this.rolesRepository.save(
        this.rolesRepository.create({ nombre: roleName }),
      );
    }

    const usuario = this.usuariosRepository.create({
      nombre: dto.nombre,
      email: dto.email,
      password_hash,
      rol,
      rol_nombre: roleName,
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

  async findAllByRole(role: UserRole): Promise<Omit<Usuario, 'password_hash' | 'refresh_token_hash'>[]> {
    const usuarios = await this.usuariosRepository.find({
      where: { rol_nombre: role },
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
    
    // Si queremos que en el JSON de respuesta 'rol' sea el nombre en lugar del objeto
    // (Opcional, dependiendo de lo que espere el frontend)
    if (rest.rol && typeof rest.rol === 'object') {
      (rest as any).rol = rest.rol.nombre;
    }
    
    return rest;
  }
}
