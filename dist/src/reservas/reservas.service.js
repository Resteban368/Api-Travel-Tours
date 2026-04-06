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
exports.ReservasService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const reserva_entity_1 = require("./entities/reserva.entity");
const servicio_entity_1 = require("../servicios/entities/servicio.entity");
const tours_maestro_entity_1 = require("../tours/entities/tours-maestro.entity");
const uuid_1 = require("uuid");
let ReservasService = class ReservasService {
    reservaRepository;
    servicioRepository;
    tourRepository;
    constructor(reservaRepository, servicioRepository, tourRepository) {
        this.reservaRepository = reservaRepository;
        this.servicioRepository = servicioRepository;
        this.tourRepository = tourRepository;
    }
    async create(dto) {
        const tour = await this.tourRepository.findOne({ where: { id: dto.id_tour } });
        if (!tour) {
            throw new common_1.NotFoundException(`Tour con ID ${dto.id_tour} no encontrado`);
        }
        let serviciosAdicionales = [];
        if (dto.servicios_ids && dto.servicios_ids.length > 0) {
            serviciosAdicionales = await this.servicioRepository.find({
                where: { id_servicio: (0, typeorm_2.In)(dto.servicios_ids) },
            });
        }
        const idReservaGenerado = `RES-${(0, uuid_1.v4)().substring(0, 8).toUpperCase()}`;
        const reserva = this.reservaRepository.create({
            id_reserva: idReservaGenerado,
            correo: dto.correo,
            estado: dto.estado ?? 'pendiente',
            tour: tour,
            servicios: serviciosAdicionales,
            integrantes: dto.integrantes || [],
        });
        const saved = await this.reservaRepository.save(reserva);
        return this.transformResponse(saved);
    }
    async findAll() {
        const reservas = await this.reservaRepository.find({
            order: { fecha_creacion: 'DESC' },
        });
        return reservas.map((r) => this.transformResponse(r));
    }
    async findOne(id) {
        const reserva = await this.reservaRepository.findOne({ where: { id } });
        if (!reserva) {
            throw new common_1.NotFoundException(`Reserva con ID ${id} no encontrada`);
        }
        return this.transformResponse(reserva);
    }
    transformResponse(reserva) {
        return {
            id: reserva.id,
            id_reserva: reserva.id_reserva,
            correo: reserva.correo,
            estado: reserva.estado,
            fecha_creacion: reserva.fecha_creacion,
            fecha_actualizacion: reserva.fecha_actualizacion,
            tour: reserva.tour ? {
                id: reserva.tour.id,
                nombre: reserva.tour.nombre_tour,
                fecha_inicio: reserva.tour.fecha_inicio,
                fecha_fin: reserva.tour.fecha_fin,
                precio: reserva.tour.precio,
                es_promocion: reserva.tour.es_promocion,
            } : null,
            servicios_adicionales: reserva.servicios ? reserva.servicios.map(s => ({
                id_servicio: s.id_servicio,
                nombre_servicio: s.nombre_servicio,
                costo: s.costo,
                descripcion: s.descripcion,
            })) : [],
            integrantes: reserva.integrantes ? reserva.integrantes.map(i => ({
                id: i.id,
                nombre: i.nombre,
                telefono: i.telefono,
                fecha_nacimiento: i.fecha_nacimiento,
            })) : []
        };
    }
};
exports.ReservasService = ReservasService;
exports.ReservasService = ReservasService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(reserva_entity_1.Reserva)),
    __param(1, (0, typeorm_1.InjectRepository)(servicio_entity_1.Servicio)),
    __param(2, (0, typeorm_1.InjectRepository)(tours_maestro_entity_1.ToursMaestro)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ReservasService);
//# sourceMappingURL=reservas.service.js.map