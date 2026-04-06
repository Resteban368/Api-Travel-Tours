import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from '../src/app.module';

const app = express();

export default async (req: any, res: any) => {
  if (!req.app.locals.nestApp) {
    console.log('🚀 Initializing NestJS app for Vercel...');
    try {
      const nestApp = await NestFactory.create(
        AppModule,
        new ExpressAdapter(app),
        { logger: ['error', 'warn', 'log'] },
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
      req.app.locals.nestApp = nestApp;
      console.log('✓ NestJS app initialized');
    } catch (error) {
      console.error('❌ Error initializing NestJS:', error);
      res.status(500).json({
        statusCode: 500,
        message: 'Failed to initialize application',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return;
    }
  }

  app(req, res);
};
