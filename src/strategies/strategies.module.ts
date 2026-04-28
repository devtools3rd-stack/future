import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WatchlistModule } from '../watchlist/watchlist.module';
import { StrategyConfigEntity } from './entities/strategy-config.entity';
import { StrategyConfigController } from './strategy-config.controller';
import { StrategyConfigService } from './strategy-config.service';

@Module({
  imports: [TypeOrmModule.forFeature([StrategyConfigEntity]), WatchlistModule],
  controllers: [StrategyConfigController],
  providers: [StrategyConfigService],
  exports: [StrategyConfigService],
})
export class StrategiesModule {}
