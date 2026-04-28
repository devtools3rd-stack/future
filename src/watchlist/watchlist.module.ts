import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WatchlistEntity } from './entities/watchlist.entity';
import { WatchlistService } from './watchlist.service';

@Module({
  imports: [TypeOrmModule.forFeature([WatchlistEntity])],
  providers: [WatchlistService],
  exports: [WatchlistService],
})
export class WatchlistModule {}
