import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ReservasService } from '../src/reservas/reservas.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ToursMaestro } from '../src/tours/entities/tours-maestro.entity';
import { Servicio } from '../src/servicios/entities/servicio.entity';

async function run() {
  console.log('Inicializando contexto de la aplicación...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const reservasService = app.get(ReservasService);
  const toursRepo = app.get<Repository<ToursMaestro>>(getRepositoryToken(ToursMaestro));
  const serviciosRepo = app.get<Repository<Servicio>>(getRepositoryToken(Servicio));

  console.log('Buscando Tours y Servicios existentes...');
  const tours = await toursRepo.find({ take: 1 });
  const servicios = await serviciosRepo.find({ take: 2 });

  if (tours.length === 0) {
    console.log('❌ No hay ningún Tour en la base de datos para crear la reserva.');
    // Creamos uno de prueba temporal para que no falle
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
    servicios_ids: idsServicios, // Asignamos los servicios existentes si los hay
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
