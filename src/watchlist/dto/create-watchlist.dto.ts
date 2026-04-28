import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { WatchlistTimeframe } from '../entities/watchlist.entity';

export class CreateWatchlistDto {
  @IsString()
  @IsNotEmpty()
  symbol!: string;

  @IsEnum(WatchlistTimeframe)
  timeframe!: WatchlistTimeframe;
}
