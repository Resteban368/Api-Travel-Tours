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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const usuarios_service_1 = require("../usuarios/usuarios.service");
let AuthService = class AuthService {
    usuariosService;
    jwtService;
    configService;
    constructor(usuariosService, jwtService, configService) {
        this.usuariosService = usuariosService;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async login(dto) {
        const usuario = await this.usuariosService.findByEmail(dto.email);
        if (!usuario || !usuario.activo) {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        const passwordOk = await bcrypt.compare(dto.password, usuario.password_hash);
        if (!passwordOk) {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        await this.usuariosService.updateUltimoAcceso(usuario.id_usuario);
        return this.generateTokenPair(usuario.id_usuario, usuario.email, usuario.rol);
    }
    async refresh(rawRefreshToken) {
        let payload;
        try {
            payload = this.jwtService.verify(rawRefreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Refresh token inválido o expirado');
        }
        const usuario = await this.usuariosService.findById(payload.sub);
        if (!usuario || !usuario.activo || !usuario.refresh_token_hash) {
            throw new common_1.UnauthorizedException('Refresh token inválido');
        }
        const tokenMatch = await bcrypt.compare(rawRefreshToken, usuario.refresh_token_hash);
        if (!tokenMatch) {
            await this.usuariosService.updateRefreshToken(usuario.id_usuario, null);
            throw new common_1.UnauthorizedException('Refresh token ya fue utilizado. Inicia sesión nuevamente.');
        }
        return this.generateTokenPair(usuario.id_usuario, usuario.email, usuario.rol);
    }
    async logout(userId) {
        await this.usuariosService.updateRefreshToken(userId, null);
        return { message: 'Sesión cerrada correctamente' };
    }
    async generateTokenPair(userId, email, rol) {
        const jwtPayload = { sub: userId, email, rol };
        const accessToken = this.jwtService.sign(jwtPayload, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: '15m',
        });
        const refreshToken = this.jwtService.sign({ sub: userId }, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: '7d',
        });
        const refreshHash = await bcrypt.hash(refreshToken, 10);
        await this.usuariosService.updateRefreshToken(userId, refreshHash);
        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            token_type: 'Bearer',
            expires_in: 900,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [usuarios_service_1.UsuariosService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map