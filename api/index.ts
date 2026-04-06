// eslint-disable-next-line @typescript-eslint/no-require-imports
const express = require('express');
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';

let AppModule: any;
let isInitialized = false;
const expressServer = express();

async function initializeApp() {
  if (isInitialized) {
    return expressServer;
  }

  console.log('🔧 Loading AppModule...');
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const appModuleModule = require('../dist/src/app.module');
    AppModule = appModuleModule.AppModule;

    if (!AppModule) {
      throw new Error('AppModule not found in compiled dist/src/app.module');
    }

    console.log('✓ AppModule loaded');
    console.log('🚀 Creating NestJS application...');

    const nestApp = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressServer),
      { logger: ['error', 'warn'] },
    );

    nestApp.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });

    nestApp.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    nestApp.enableCors({
      origin: true,
      credentials: true,
    });

    await nestApp.init();
    isInitialized = true;

    console.log('✓ NestJS application ready');
    return expressServer;
  } catch (error) {
    console.error('❌ Failed to initialize:', error);
    throw error;
  }
}

export default async (req: any, res: any) => {
  try {
    const app = await initializeApp();
    app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        statusCode: 500,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }
};
