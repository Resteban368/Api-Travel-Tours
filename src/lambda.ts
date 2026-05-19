import { NestFactory } from '@nestjs/core';
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression = require('compression');
import express from 'express';
import { Logger } from 'nestjs-pino';
import type { Request, Response } from 'express';

let cachedApp: ReturnType<typeof express> | null = null;

async function bootstrap(): Promise<ReturnType<typeof express>> {
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    adapter,
    {
      bufferLogs: true,
    },
  );

  app.useLogger(app.get(Logger));

  app.use(compression({ threshold: 1024 }));

  app.use('/v1/uploads', express.json({ limit: '10mb' }));
  app.use('/v1/uploads', express.urlencoded({ limit: '10mb', extended: true }));

  app.useBodyParser('json', { limit: '1mb' });
  app.useBodyParser('urlencoded', { limit: '1mb', extended: true });

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

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

  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : true;

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  await app.init();
  return expressApp;
}

module.exports = async (req: Request, res: Response) => {
  if (!cachedApp) {
    cachedApp = await bootstrap();
  }
  cachedApp(req, res);
};
