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
exports.ToursController = void 0;
const common_1 = require("@nestjs/common");
const tours_service_1 = require("./tours.service");
const create_tour_dto_1 = require("./dto/create-tour.dto");
const update_tour_dto_1 = require("./dto/update-tour.dto");
const search_tours_dto_1 = require("./dto/search-tours.dto");
let ToursController = class ToursController {
    toursService;
    constructor(toursService) {
        this.toursService = toursService;
    }
    create(dto) {
        return this.toursService.create(dto);
    }
    findAll() {
        return this.toursService.findAll();
    }
    searchByEmbedding(dto, limit) {
        if (dto.embedding.length !== 3072) {
            throw new common_1.BadRequestException('embedding debe tener 3072 dimensiones (text-embedding-3-large)');
        }
        return this.toursService.searchByEmbedding(dto.embedding, Math.min(Math.max(1, limit), 50));
    }
    findOne(id) {
        return this.toursService.findOne(id);
    }
    update(id, dto) {
        return this.toursService.update(id, dto);
    }
};
exports.ToursController = ToursController;
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_tour_dto_1.CreateTourDto]),
    __metadata("design:returntype", void 0)
], ToursController.prototype, "create", null);
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ToursController.prototype, "findAll", null);
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Post)('search'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(10), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_tours_dto_1.SearchToursDto, Number]),
    __metadata("design:returntype", void 0)
], ToursController.prototype, "searchByEmbedding", null);
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ToursController.prototype, "findOne", null);
__decorate([
    (0, common_1.Version)('1'),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_tour_dto_1.UpdateTourDto]),
    __metadata("design:returntype", void 0)
], ToursController.prototype, "update", null);
exports.ToursController = ToursController = __decorate([
    (0, common_1.Controller)('tours'),
    __metadata("design:paramtypes", [tours_service_1.ToursService])
], ToursController);
//# sourceMappingURL=tours.controller.js.map