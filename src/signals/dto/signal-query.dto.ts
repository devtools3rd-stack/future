import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SignalDirection } from '../entities/signal.entity';

export class SignalQueryDto {
  @IsOptional()
  @IsString()
  symbol?: string;

  @IsOptional()
  @IsString()
  timeframe?: string;

  @IsOptional()
  @IsString()
  strategyKey?: string;

  @IsOptional()
  @IsEnum(SignalDirection)
  direction?: SignalDirection;
}
