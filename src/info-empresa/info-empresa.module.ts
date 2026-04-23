import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InfoEmpresaService } from './info-empresa.service';
import { InfoEmpresaController } from './info-empresa.controller';
import { InfoEmpresa } from './entities/info-empresa.entity';
import { N8nVector } from '../tours/entities/n8n-vector.entity';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { AuditoriaGeneralModule } from '../auditoria-general/auditoria-general.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InfoEmpresa, N8nVector]),
    EmbeddingsModule,
    AuditoriaGeneralModule,
  ],
  controllers: [InfoEmpresaController],
  providers: [InfoEmpresaService],
  exports: [InfoEmpresaService],
})
export class InfoEmpresaModule {}
