import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar versionamiento de la API
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true, // Automáticamente convierte payloads a instancias de DTO
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
}
bootstrap();
