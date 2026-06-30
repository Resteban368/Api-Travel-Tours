import { IsBoolean } from 'class-validator';

export class ToggleWorkflowDto {
  @IsBoolean({ message: 'active debe ser true o false' })
  active: boolean;
}
