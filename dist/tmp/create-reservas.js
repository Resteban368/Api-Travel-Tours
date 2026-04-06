"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const reservas_service_1 = require("../src/reservas/reservas.service");
const typeorm_1 = require("@nestjs/typeorm");
const tours_maestro_entity_1 = require("../src/tours/entities/tours-maestro.entity");
const servicio_entity_1 = require("../src/servicios/entities/servicio.entity");
async function run() {
    console.log('Inicializando contexto de la aplicación...');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const reservasService = app.get(reservas_service_1.ReservasService);
    const toursRepo = app.get((0, typeorm_1.getRepositoryToken)(tours_maestro_entity_1.ToursMaestro));
    const serviciosRepo = app.get((0, typeorm_1.getRepositoryToken)(servicio_entity_1.Servicio));
    console.log('Buscando Tours y Servicios existentes...');
    const tours = await toursRepo.find({ take: 1 });
    const servicios = await serviciosRepo.find({ take: 2 });
    if (tours.length === 0) {
        console.log('❌ No hay ningún Tour en la base de datos para crear la reserva.');
        const tourGenerico = toursRepo.create({
            id_tour: 9999,
            nombre_tour: 'Tour Creado Para Prueba',
            precio: 150000,
            es_promocion: false,
        });
        const t = await toursRepo.save(tourGenerico);
        tours.push(t);
    }
    const idTour = tours[0].id;
    const idsServicios = servicios.map(s => s.id_servicio);
    console.log('Creando Reserva 1...');
    await reservasService.create({
        id_tour: idTour,
        correo: 'familia.gomez@test.com',
        estado: 'al dia',
        servicios_ids: idsServicios,
        integrantes: [
            { nombre: 'Laura Gomez', telefono: '3109990000', fecha_nacimiento: '1995-10-12' },
            { nombre: 'David Gomez', fecha_nacimiento: '1998-05-20' }
        ]
    });
    console.log('Creando Reserva 2...');
    await reservasService.create({
        id_tour: idTour,
        correo: 'carlos.viajero@test.com',
        estado: 'pendiente',
        integrantes: [
            { nombre: 'Carlos Ruiz', telefono: '3201112233', fecha_nacimiento: '1988-02-01' }
        ]
    });
    console.log('✅ Reservas creadas exitosamente.');
    await app.close();
}
run().catch(console.error);
//# sourceMappingURL=create-reservas.js.map