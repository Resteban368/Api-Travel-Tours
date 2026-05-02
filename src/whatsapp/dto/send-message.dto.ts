import { IsString, IsNotEmpty, IsInt, IsPositive } from 'class-validator';

export class SendMessageDto {
  @IsInt()
  @IsPositive()
  conversationId: number;

  @IsString()
  @IsNotEmpty()
  content: string;
}
