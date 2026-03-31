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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfoEmpresaController = void 0;
const common_1 = require("@nestjs/common");
const info_empresa_service_1 = require("./info-empresa.service");
const info_empresa_dto_1 = require("./dto/info-empresa.dto");
let InfoEmpresaController = class InfoEmpresaController {
    infoEmpresaService;
    constructor(infoEmpresaService) {
        this.infoEmpresaService = infoEmpresaService;
    }
    create(createDto) {
        return this.infoEmpresaService.create(createDto);
    }
    findAll() {
        return this.infoEmpresaService.findAll();
    }
    findOne(id) {
        return this.infoEmpresaService.findOne(id);
    }
    update(id, updateDto) {
        return this.infoEmpresaService.update(id, updateDto);
    }
    remove(id) {
        return this.infoEmpresaService.remove(id);
    }
    syncVectors() {
        return this.infoEmpresaService.syncInfoToVector();
    }
};
exports.InfoEmpresaController = InfoEmpresaController;
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [info_empresa_dto_1.CreateInfoEmpresaDto]),
    __metadata("design:returntype", void 0)
], InfoEmpresaController.prototype, "create", null);
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InfoEmpresaController.prototype, "findAll", null);
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], InfoEmpresaController.prototype, "findOne", null);
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, info_empresa_dto_1.UpdateInfoEmpresaDto]),
    __metadata("design:returntype", void 0)
], InfoEmpresaController.prototype, "update", null);
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], InfoEmpresaController.prototype, "remove", null);
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Post)('sync-vectors'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InfoEmpresaController.prototype, "syncVectors", null);
exports.InfoEmpresaController = InfoEmpresaController = __decorate([
    (0, common_1.Controller)('info-empresa'),
    __metadata("design:paramtypes", [info_empresa_service_1.InfoEmpresaService])
], InfoEmpresaController);
//# sourceMappingURL=info-empresa.controller.js.map