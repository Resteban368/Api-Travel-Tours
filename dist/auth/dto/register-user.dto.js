"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterUserDto = void 0;
const class_validator_1 = require("class-validator");
class RegisterUserDto {
    nombre;
    email;
    password;
    rol;
}
exports.RegisterUserDto = RegisterUserDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'El nombre es obligatorio' }),
    __metadata("design:type", String)
], RegisterUserDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'El email no es válido' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El email es obligatorio' }),
    __metadata("design:type", String)
], RegisterUserDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8, { message: 'La contraseña debe tener al menos 8 caracteres' }),
    __metadata("design:type", String)
], RegisterUserDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['admin', 'agente'], { message: 'El rol debe ser admin o agente' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterUserDto.prototype, "rol", void 0);
//# sourceMappingURL=register-user.dto.js.map