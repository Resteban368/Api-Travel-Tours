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
exports.PagosRealizadosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const pago_realizado_entity_1 = require("./entities/pago-realizado.entity");
const auditoria_pago_entity_1 = require("./entities/auditoria-pago.entity");
const CAMPOS_AUDITABLES = [
    'chat_id',
    'tipo_documento',
    'monto',
    'proveedor_comercio',
    'nit',
    'metodo_pago',
    'referencia',
    'fecha_documento',
    'is_validated',
    'url_imagen',
];
let PagosRealizadosService = class PagosRealizadosService {
    pagosRepository;
    auditoriaRepository;
    constructor(pagosRepository, auditoriaRepository) {
        this.pagosRepository = pagosRepository;
        this.auditoriaRepository = auditoriaRepository;
    }
    async create(createDto, realizadoPor) {
        const existing = await this.pagosRepository.findOne({
            where: { referencia: createDto.referencia },
        });
        if (existing) {
            throw new common_1.ConflictException(`Ya existe un pago con la referencia ${createDto.referencia}`);
        }
        const pago = this.pagosRepository.create(createDto);
        const pagoCreado = await this.pagosRepository.save(pago);
        await this.auditoriaRepository.insert({
            id_pago: pagoCreado.id_pago,
            accion: 'CREACION',
            realizado_por: realizadoPor ?? null,
        });
        return pagoCreado;
    }
    async findAll(startDate, endDate) {
        const where = {};
        if (startDate && endDate) {
            where.fecha_creacion = (0, typeorm_2.Between)(new Date(startDate), new Date(endDate));
        }
        else if (startDate) {
            where.fecha_creacion = (0, typeorm_2.Between)(new Date(startDate), new Date());
        }
        return await this.pagosRepository.find({
            where,
            order: { fecha_creacion: 'DESC' },
        });
    }
    async findOne(id) {
        const pago = await this.pagosRepository.findOne({
            where: { id_pago: id },
        });
        if (!pago) {
            throw new common_1.NotFoundException(`Pago con ID ${id} no encontrado`);
        }
        return pago;
    }
    async update(id, updateDto, realizadoPor) {
        const pago = await this.findOne(id);
        if (updateDto.referencia && updateDto.referencia !== pago.referencia) {
            const existing = await this.pagosRepository.findOne({
                where: { referencia: updateDto.referencia },
            });
            if (existing) {
                throw new common_1.ConflictException(`Ya existe un pago con la referencia ${updateDto.referencia}`);
            }
        }
        const registrosAuditoria = [];
        for (const campo of CAMPOS_AUDITABLES) {
            if (campo in updateDto && updateDto[campo] !== undefined) {
                const valorAnterior = pago[campo];
                const valorNuevo = updateDto[campo];
                if (String(valorAnterior) !== String(valorNuevo)) {
                    const accion = campo === 'is_validated' ? 'VALIDACION' : 'EDICION';
                    registrosAuditoria.push({
                        id_pago: id,
                        accion,
                        campo_modificado: campo,
                        valor_anterior: valorAnterior !== null && valorAnterior !== undefined
                            ? String(valorAnterior)
                            : null,
                        valor_nuevo: valorNuevo !== null && valorNuevo !== undefined
                            ? String(valorNuevo)
                            : null,
                        realizado_por: realizadoPor ?? null,
                    });
                }
            }
        }
        Object.assign(pago, updateDto);
        const pagoActualizado = await this.pagosRepository.save(pago);
        if (registrosAuditoria.length > 0) {
            await this.auditoriaRepository.insert(registrosAuditoria);
        }
        return pagoActualizado;
    }
    async remove(id, realizadoPor) {
        const pago = await this.findOne(id);
        await this.auditoriaRepository.insert({
            id_pago: id,
            accion: 'ELIMINACION',
            realizado_por: realizadoPor ?? null,
        });
        await this.pagosRepository.remove(pago);
        return { message: `Pago con ID ${id} eliminado correctamente` };
    }
    async findAuditoria(idPago, startDate, endDate) {
        const where = {};
        if (idPago) {
            where.id_pago = idPago;
        }
        if (startDate && endDate) {
            where.fecha_auditoria = (0, typeorm_2.Between)(new Date(startDate), new Date(endDate));
        }
        else if (startDate) {
            where.fecha_auditoria = (0, typeorm_2.Between)(new Date(startDate), new Date());
        }
        return await this.auditoriaRepository.find({
            where,
            order: { fecha_auditoria: 'DESC' },
        });
    }
};
exports.PagosRealizadosService = PagosRealizadosService;
exports.PagosRealizadosService = PagosRealizadosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(pago_realizado_entity_1.PagoRealizado)),
    __param(1, (0, typeorm_1.InjectRepository)(auditoria_pago_entity_1.AuditoriaPago)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], PagosRealizadosService);
//# sourceMappingURL=pagos-realizados.service.js.map