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
exports.PoliticasReservaController = void 0;
const common_1 = require("@nestjs/common");
const politicas_reserva_service_1 = require("./politicas-reserva.service");
const politicas_reserva_dto_1 = require("./dto/politicas-reserva.dto");
let PoliticasReservaController = class PoliticasReservaController {
    politicasReservaService;
    constructor(politicasReservaService) {
        this.politicasReservaService = politicasReservaService;
    }
    create(createDto) {
        return this.politicasReservaService.create(createDto);
    }
    findAll() {
        return this.politicasReservaService.findAll();
    }
    findOne(id) {
        return this.politicasReservaService.findOne(id);
    }
    update(id, updateDto) {
        return this.politicasReservaService.update(id, updateDto);
    }
    remove(id) {
        return this.politicasReservaService.remove(id);
    }
    syncVectors() {
        return this.politicasReservaService.syncAllPoliticasToVector();
    }
};
exports.PoliticasReservaController = PoliticasReservaController;
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [politicas_reserva_dto_1.CreatePoliticaReservaDto]),
    __metadata("design:returntype", void 0)
], PoliticasReservaController.prototype, "create", null);
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PoliticasReservaController.prototype, "findAll", null);
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PoliticasReservaController.prototype, "findOne", null);
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, politicas_reserva_dto_1.UpdatePoliticaReservaDto]),
    __metadata("design:returntype", void 0)
], PoliticasReservaController.prototype, "update", null);
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PoliticasReservaController.prototype, "remove", null);
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Post)('sync-vectors'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PoliticasReservaController.prototype, "syncVectors", null);
exports.PoliticasReservaController = PoliticasReservaController = __decorate([
    (0, common_1.Controller)('politicas-reserva'),
    __metadata("design:paramtypes", [politicas_reserva_service_1.PoliticasReservaService])
], PoliticasReservaController);
//# sourceMappingURL=politicas-reserva.controller.js.map