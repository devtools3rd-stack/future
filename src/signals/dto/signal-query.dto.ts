import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
