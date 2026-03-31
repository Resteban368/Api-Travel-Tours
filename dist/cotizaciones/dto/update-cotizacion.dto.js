"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCotizacionDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_cotizacion_dto_1 = require("./create-cotizacion.dto");
class UpdateCotizacionDto extends (0, mapped_types_1.PartialType)(create_cotizacion_dto_1.CreateCotizacionDto) {
}
exports.UpdateCotizacionDto = UpdateCotizacionDto;
//# sourceMappingURL=update-cotizacion.dto.js.map