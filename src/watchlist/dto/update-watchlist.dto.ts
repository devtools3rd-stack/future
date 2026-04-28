import { IsEnum, IsOptional } from 'class-validator';
import {
  WatchlistStatus,
  WatchlistTimeframe,
} from '../entities/watchlist.entity';

export class UpdateWatchlistDto {
  @IsOptional()
  @IsEnum(WatchlistTimeframe)
  timeframe?: WatchlistTimeframe;

  @IsOptional()
  @IsEnum(WatchlistStatus)
  status?: WatchlistStatus;
}
