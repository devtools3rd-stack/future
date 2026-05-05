import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WatchlistModule } from '../watchlist/watchlist.module';
import { StrategyConfigEntity } from './entities/strategy-config.entity';
import { StrategyRegistry } from './engine/strategy-registry';
import { StrategyRunnerService } from './engine/strategy-runner.service';
import { IctStrategy } from './engine/strategies/ict.strategy';
import { SmcStrategy } from './engine/strategies/smc.strategy';
import { StrategyConfigController } from './strategy-config.controller';
import { StrategyConfigService } from './strategy-config.service';

@Module({
  imports: [TypeOrmModule.forFeature([StrategyConfigEntity]), WatchlistModule],
  controllers: [StrategyConfigController],
  providers: [
    StrategyConfigService,
    StrategyRunnerService,
    SmcStrategy,
    IctStrategy,
    {
      provide: StrategyRegistry,
      useFactory: (smcStrategy: SmcStrategy, ictStrategy: IctStrategy) =>
        new StrategyRegistry([smcStrategy, ictStrategy]),
      inject: [SmcStrategy, IctStrategy],
    },
  ],
  exports: [StrategyConfigService, StrategyRegistry, StrategyRunnerService],
})
export class StrategiesModule {}
