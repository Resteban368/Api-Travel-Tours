import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { IncomingMessage, ServerResponse } from 'http';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const expressServer = require('express')();

async function createNestApp() {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressServer),
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
  return app;
}

let isInitialized = false;

// Handler exportado para Vercel Serverless Functions
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  if (!isInitialized) {
    await createNestApp();
    isInitialized = true;
  }
  expressServer(req, res);
}

// Ejecución local estándar (npm run start:dev, Railway, Docker)
if (require.main === module) {
  createNestApp().then((app) => {
    const port = process.env.PORT ?? 3001;
    app.listen(port, () => {
      console.log(`🚀 App running on port ${port}`);
    });
  });
}
