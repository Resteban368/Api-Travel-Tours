import {
  BadRequestException,
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
import { PermisoAgente, TipoPermiso } from '../modulos/entities/permiso-agente.entity';
import { Modulo } from '../modulos/entities/modulo.entity';
import { CreateUsuarioDto, PermisoAgenteDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsuariosService implements OnModuleInit {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
    @InjectRepository(Rol)
    private readonly rolesRepository: Repository<Rol>,
    @InjectRepository(PermisoAgente)
    private readonly permisoRepo: Repository<PermisoAgente>,
    @InjectRepository(Modulo)
    private readonly moduloRepo: Repository<Modulo>,
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

  // ─── INTERNO ──────────────────────────────────────────────────────────────

  async findByEmail(email: string): Promise<Usuario | null> {
    return this.usuariosRepository.findOne({ where: { email } });
  }

  async findById(id: number): Promise<Usuario | null> {
    return this.usuariosRepository.findOne({ where: { id_usuario: id } });
  }

  async updateRefreshToken(id: number, tokenHash: string | null): Promise<void> {
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

    if (dto.permisos && dto.permisos.length > 0) {
      await this.asignarPermisos(saved.id_usuario, dto.permisos);
    }

    return this.sanitize(saved);
  }

  async findAll() {
    const usuarios = await this.usuariosRepository.find({
      order: { fecha_creacion: 'DESC' },
    });
    return Promise.all(
      usuarios.map(async (u) => ({
        ...this.sanitize(u),
        permisos: await this.obtenerPermisos(u.id_usuario, u.rol_nombre),
      })),
    );
  }

  async findAllByRole(role: UserRole) {
    const usuarios = await this.usuariosRepository.find({
      where: { rol_nombre: role },
      order: { fecha_creacion: 'DESC' },
    });
    return Promise.all(
      usuarios.map(async (u) => ({
        ...this.sanitize(u),
        permisos: await this.obtenerPermisos(u.id_usuario, u.rol_nombre),
      })),
    );
  }

  async findOne(id: number) {
    const usuario = await this.findById(id);
    if (!usuario) throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    return {
      ...this.sanitize(usuario),
      permisos: await this.obtenerPermisos(id, usuario.rol_nombre),
    };
  }

  async update(id: number, dto: UpdateUsuarioDto): Promise<Omit<Usuario, 'password_hash' | 'refresh_token_hash'>> {
    const usuario = await this.findById(id);
    if (!usuario) throw new NotFoundException(`Usuario con ID ${id} no encontrado`);

    if (dto.email && dto.email !== usuario.email) {
      const exists = await this.findByEmail(dto.email);
      if (exists) throw new ConflictException(`Ya existe un usuario con el email ${dto.email}`);
    }

    const { permisos, ...datosUsuario } = dto;
    Object.assign(usuario, datosUsuario);
    const saved = await this.usuariosRepository.save(usuario);

    if (permisos !== undefined) {
      await this.asignarPermisos(id, permisos);
    }

    return this.sanitize(saved);
  }

  async changePassword(id: number, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const usuario = await this.findById(id);
    if (!usuario) throw new NotFoundException(`Usuario con ID ${id} no encontrado`);

    const matches = await bcrypt.compare(currentPassword, usuario.password_hash);
    if (!matches) throw new BadRequestException('La contraseña actual es incorrecta');

    const password_hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.usuariosRepository.update(id, { password_hash, refresh_token_hash: null });

    return { message: 'Contraseña actualizada correctamente' };
  }

  async remove(id: number): Promise<{ message: string }> {
    const usuario = await this.findById(id);
    if (!usuario) throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    await this.permisoRepo.delete({ usuario_id: id });
    await this.usuariosRepository.remove(usuario);
    return { message: `Usuario con ID ${id} eliminado` };
  }

  // ─── PERMISOS ─────────────────────────────────────────────────────────────

  async asignarPermisos(usuarioId: number, permisos: PermisoAgenteDto[]): Promise<void> {
    await this.permisoRepo.delete({ usuario_id: usuarioId });
    if (permisos.length === 0) return;
    const nuevos = permisos.map((p) =>
      this.permisoRepo.create({
        usuario_id: usuarioId,
        modulo_id: p.modulo_id,
        tipo_permiso: p.tipo_permiso,
      }),
    );
    await this.permisoRepo.save(nuevos);
  }

  async obtenerPermisos(usuarioId: number, rol?: string): Promise<Record<string, TipoPermiso>> {
    if (rol === 'admin') {
      const modulos = await this.moduloRepo.find({ where: { estado: true } });
      return Object.fromEntries(modulos.map((m) => [m.nombre, 'completo' as TipoPermiso]));
    }
    const permisos = await this.permisoRepo.find({ where: { usuario_id: usuarioId } });
    return Object.fromEntries(
      permisos.map((p) => [p.modulo.nombre, p.tipo_permiso]),
    );
  }

  // ─── AGENTES (con permisos incluidos) ─────────────────────────────────────

  async findAgenteWithPermisos(id: number) {
    const usuario = await this.findById(id);
    if (!usuario) throw new NotFoundException(`Agente con ID ${id} no encontrado`);
    const permisos = await this.obtenerPermisos(id, usuario.rol_nombre);
    return { ...this.sanitize(usuario), permisos };
  }

  async findAllAgentesWithPermisos() {
    const agentes = await this.usuariosRepository.find({
      where: { rol_nombre: 'agente' },
      order: { fecha_creacion: 'DESC' },
    });
    return Promise.all(
      agentes.map(async (a) => {
        const permisos = await this.obtenerPermisos(a.id_usuario);
        return { ...this.sanitize(a), permisos };
      }),
    );
  }

  // ─── PRIVADO ──────────────────────────────────────────────────────────────

  private sanitize(usuario: Usuario): Omit<Usuario, 'password_hash' | 'refresh_token_hash'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, refresh_token_hash, ...rest } = usuario;
    if (rest.rol && typeof rest.rol === 'object') {
      (rest as any).rol = rest.rol.nombre;
    }
    return rest;
  }
}
