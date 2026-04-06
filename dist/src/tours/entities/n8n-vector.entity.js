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
exports.N8nVector = void 0;
const typeorm_1 = require("typeorm");
const utils_1 = require("pgvector/utils");
const vectorTransformer = {
    from: (val) => {
        if (val == null)
            return null;
        if (Array.isArray(val))
            return val;
        if (typeof val === 'string')
            return (0, utils_1.fromSql)(val);
        return null;
    },
    to: (val) => val && Array.isArray(val) ? (0, utils_1.toSql)(val) : null,
};
let N8nVector = class N8nVector {
    id;
    text;
    metadata;
    embedding;
    fileId;
    modifiedTime;
};
exports.N8nVector = N8nVector;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], N8nVector.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], N8nVector.prototype, "text", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], N8nVector.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'vector',
        length: 3072,
        nullable: true,
        transformer: vectorTransformer,
    }),
    __metadata("design:type", Object)
], N8nVector.prototype, "embedding", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_id', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], N8nVector.prototype, "fileId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'modifiedTime', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], N8nVector.prototype, "modifiedTime", void 0);
exports.N8nVector = N8nVector = __decorate([
    (0, typeorm_1.Entity)('n8n_vectors')
], N8nVector);
//# sourceMappingURL=n8n-vector.entity.js.map