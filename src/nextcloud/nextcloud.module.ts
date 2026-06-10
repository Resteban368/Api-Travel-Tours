import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as https from 'https';
import { NextcloudService } from './nextcloud.service';
import { NextcloudController } from './nextcloud.controller';

@Module({
  imports: [
    ConfigModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        // NEXTCLOUD_REJECT_UNAUTHORIZED=false → acepta certificados auto-firmados
        const rejectUnauthorized =
          configService.get<string>('NEXTCLOUD_REJECT_UNAUTHORIZED') !== 'false';
        return {
          timeout: 30000,
          httpsAgent: new https.Agent({ rejectUnauthorized }),
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [NextcloudController],
  providers: [NextcloudService],
  exports: [NextcloudService],
})
export class NextcloudModule {}
