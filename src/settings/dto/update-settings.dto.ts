import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  telegram_bot_token?: string;

  @IsOptional()
  @IsString()
  telegram_chat_id?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  cooldown_minutes?: number;
}
