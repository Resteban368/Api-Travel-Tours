import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import type { IncomingMessage, ServerResponse } from 'http';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const expressServer = require('express')();

let isInitialized = false;

async function bootstrap() {
  if (isInitialized) return;

  console.log('🔍 Starting bootstrap...');
  console.log('📍 Environment variables check:');
  console.log('  - DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Missing');
  console.log('  - JWT_SECRET:', process.env.JWT_SECRET ? '✓ Set' : '✗ Missing');
  console.log('  - NODE_ENV:', process.env.NODE_ENV);

  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressServer),
    { logger: ['error', 'warn', 'log'] },
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

  app.enableCors({
    origin: true,
    credentials: true,
  });

  await app.init();
  isInitialized = true;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  try {
    await bootstrap();
    expressServer(req, res);
  } catch (error) {
    console.error('❌ Handler initialization failed:', error);
    res.statusCode = 500;
    res.end(
      JSON.stringify({
        statusCode: 500,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    );
  }
}
