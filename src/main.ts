import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression = require('compression');
import express from 'express';
import { join } from 'path';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const requiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL'];
  const missing = requiredEnvVars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    console.error(`FATAL: Variables de entorno requeridas no definidas: ${missing.join(', ')}`);
    process.exit(1);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.useStaticAssets(join(process.cwd(), 'public'));
  app.useStaticAssets(join(process.cwd(), 'assets'), { prefix: '/assets' });

  app.use(compression({ threshold: 1024 }));

  // Límite específico para uploads (10mb)
  app.use('/v1/uploads', express.json({ limit: '10mb' }));
  app.use('/v1/uploads', express.urlencoded({ limit: '10mb', extended: true }));

  // Límite global para el resto (1mb)
  app.useBodyParser('json', { limit: '1mb' });
  app.useBodyParser('urlencoded', { limit: '1mb', extended: true });

  app.use(helmet({
    contentSecurityPolicy: false,   // no aplica para API REST
    crossOriginEmbedderPolicy: false,
  }));

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const isDev = process.env.NODE_ENV !== 'production';

  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : [];

  app.enableCors({
    origin: isDev
      ? (origin, callback) => {
          // En desarrollo: permite cualquier localhost (cualquier puerto) y sin origin (curl, Postman)
          if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        }
      : allowedOrigins,
    credentials: true,
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 App running on port ${port}`);
  });
}
bootstrap();
