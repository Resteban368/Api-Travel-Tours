import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { N8nService } from './n8n.service';
import { N8nController } from './n8n.controller';
import { AdminKeyGuard } from './guards/admin-key.guard';

@Module({
  imports: [HttpModule],
  controllers: [N8nController],
  providers: [N8nService, AdminKeyGuard],
})
export class N8nModule {}
