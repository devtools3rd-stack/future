import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WatchlistModule } from '../watchlist/watchlist.module';
import { StrategyConfigEntity } from './entities/strategy-config.entity';
import { StrategyRegistry } from './engine/strategy-registry';
import { StrategyRunnerService } from './engine/strategy-runner.service';
import { EmaCrossStrategy } from './engine/strategies/ema-cross.strategy';
import { MacdCrossStrategy } from './engine/strategies/macd-cross.strategy';
import { RsiExtremeStrategy } from './engine/strategies/rsi-extreme.strategy';
import { StrategyConfigController } from './strategy-config.controller';
import { StrategyConfigService } from './strategy-config.service';

@Module({
  imports: [TypeOrmModule.forFeature([StrategyConfigEntity]), WatchlistModule],
  controllers: [StrategyConfigController],
  providers: [
    StrategyConfigService,
    StrategyRunnerService,
    EmaCrossStrategy,
    RsiExtremeStrategy,
    MacdCrossStrategy,
    {
      provide: StrategyRegistry,
      useFactory: (
        emaCrossStrategy: EmaCrossStrategy,
        rsiExtremeStrategy: RsiExtremeStrategy,
        macdCrossStrategy: MacdCrossStrategy,
      ) =>
        new StrategyRegistry([
          emaCrossStrategy,
          rsiExtremeStrategy,
          macdCrossStrategy,
        ]),
      inject: [EmaCrossStrategy, RsiExtremeStrategy, MacdCrossStrategy],
    },
  ],
  exports: [StrategyConfigService, StrategyRegistry, StrategyRunnerService],
})
export class StrategiesModule {}
