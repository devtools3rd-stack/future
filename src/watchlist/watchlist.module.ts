import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WatchlistEntity } from './entities/watchlist.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WatchlistEntity])],
})
export class WatchlistModule {}
