import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as https from 'https';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { ImgController } from './img.controller';
import { AuditoriaGeneralModule } from '../auditoria-general/auditoria-general.module';

@Module({
  imports: [
    ConfigModule,
    AuditoriaGeneralModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        // STORAGE_REJECT_UNAUTHORIZED=false → acepta certificados auto-firmados (fallback NEXTCLOUD_*)
        const rejectUnauthorized =
          (configService.get<string>('STORAGE_REJECT_UNAUTHORIZED') ??
            configService.get<string>('NEXTCLOUD_REJECT_UNAUTHORIZED')) !==
          'false';
        return {
          timeout: 30000,
          httpsAgent: new https.Agent({ rejectUnauthorized }),
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [StorageController, ImgController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
