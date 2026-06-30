import { Body, Controller, Get, Patch, UseGuards, Version } from '@nestjs/common';
import { N8nService } from './n8n.service';
import { ToggleWorkflowDto } from './dto/toggle-workflow.dto';
import { AdminKeyGuard } from './guards/admin-key.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('n8n')
@Public()
@UseGuards(AdminKeyGuard)
export class N8nController {
  constructor(private readonly n8nService: N8nService) {}

  @Version('1')
  @Get('workflow/status')
  status() {
    return this.n8nService.getWorkflowStatus();
  }

  @Version('1')
  @Patch('workflow/toggle')
  toggle(@Body() dto: ToggleWorkflowDto) {
    return this.n8nService.setWorkflowActive(dto.active);
  }
}
