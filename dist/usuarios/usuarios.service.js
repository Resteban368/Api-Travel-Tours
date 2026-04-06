"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsuariosService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const usuario_entity_1 = require("./entities/usuario.entity");
const rol_entity_1 = require("./entities/rol.entity");
const BCRYPT_ROUNDS = 12;
let UsuariosService = class UsuariosService {
    usuariosRepository;
    rolesRepository;
    configService;
    constructor(usuariosRepository, rolesRepository, configService) {
        this.usuariosRepository = usuariosRepository;
        this.rolesRepository = rolesRepository;
        this.configService = configService;
    }
    async onModuleInit() {
        await this.seedAdmin();
    }
    async seedAdmin() {
        const adminEmail = this.configService.get('SEED_ADMIN_EMAIL');
        const adminPassword = this.configService.get('SEED_ADMIN_PASSWORD');
        if (!adminEmail || !adminPassword)
            return;
        const exists = await this.findByEmail(adminEmail);
        if (exists)
            return;
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
    async findByEmail(email) {
        return this.usuariosRepository.findOne({ where: { email } });
    }
    async findById(id) {
        return this.usuariosRepository.findOne({ where: { id_usuario: id } });
    }
    async updateRefreshToken(id, tokenHash) {
        await this.usuariosRepository.update(id, { refresh_token_hash: tokenHash });
    }
    async updateUltimoAcceso(id) {
        await this.usuariosRepository.update(id, { ultimo_acceso: new Date() });
    }
    async create(dto) {
        const exists = await this.findByEmail(dto.email);
        if (exists) {
            throw new common_1.ConflictException(`Ya existe un usuario con el email ${dto.email}`);
        }
        const password_hash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
        const roleName = dto.rol ?? 'agente';
        let rol = await this.rolesRepository.findOne({ where: { nombre: roleName } });
        if (!rol) {
            rol = await this.rolesRepository.save(this.rolesRepository.create({ nombre: roleName }));
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
    async findAll() {
        const usuarios = await this.usuariosRepository.find({
            order: { fecha_creacion: 'DESC' },
        });
        return usuarios.map(this.sanitize);
    }
    async findAllByRole(role) {
        const usuarios = await this.usuariosRepository.find({
            where: { rol_nombre: role },
            order: { fecha_creacion: 'DESC' },
        });
        return usuarios.map(this.sanitize);
    }
    async findOne(id) {
        const usuario = await this.findById(id);
        if (!usuario)
            throw new common_1.NotFoundException(`Usuario con ID ${id} no encontrado`);
        return this.sanitize(usuario);
    }
    async update(id, dto) {
        const usuario = await this.findById(id);
        if (!usuario)
            throw new common_1.NotFoundException(`Usuario con ID ${id} no encontrado`);
        if (dto.email && dto.email !== usuario.email) {
            const exists = await this.findByEmail(dto.email);
            if (exists)
                throw new common_1.ConflictException(`Ya existe un usuario con el email ${dto.email}`);
        }
        Object.assign(usuario, dto);
        const saved = await this.usuariosRepository.save(usuario);
        return this.sanitize(saved);
    }
    async remove(id) {
        const usuario = await this.findById(id);
        if (!usuario)
            throw new common_1.NotFoundException(`Usuario con ID ${id} no encontrado`);
        await this.usuariosRepository.remove(usuario);
        return { message: `Usuario con ID ${id} eliminado` };
    }
    sanitize(usuario) {
        const { password_hash, refresh_token_hash, ...rest } = usuario;
        if (rest.rol && typeof rest.rol === 'object') {
            rest.rol = rest.rol.nombre;
        }
        return rest;
    }
};
exports.UsuariosService = UsuariosService;
exports.UsuariosService = UsuariosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(usuario_entity_1.Usuario)),
    __param(1, (0, typeorm_1.InjectRepository)(rol_entity_1.Rol)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService])
], UsuariosService);
//# sourceMappingURL=usuarios.service.js.map