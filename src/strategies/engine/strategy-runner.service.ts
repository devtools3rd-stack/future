import { Injectable, Logger } from '@nestjs/common';
import { Candle } from '../../symbols/binance.service';
import { WatchlistEntity } from '../../watchlist/entities/watchlist.entity';
import { StrategyConfigEntity } from '../entities/strategy-config.entity';
import { StrategyKey } from '../strategy-config.constants';
import { StrategyRegistry } from './strategy-registry';
import { StrategySignal } from './strategy.types';

const DEFAULT_STRATEGY_PARAMS: Record<StrategyKey, Record<string, unknown>> = {
  [StrategyKey.SMC]: {
    swingLookback: 5,
    liquidityLookback: 20,
    minDisplacementPercent: 0.3,
    requireFairValueGap: true,
    usePremiumDiscount: true,
    minRiskReward: 2,
  },
  [StrategyKey.ICT]: {
    swingLookback: 5,
    liquidityLookback: 20,
    minDisplacementPercent: 0.25,
    killZone: 'any',
    requireFairValueGap: true,
    minRiskReward: 2,
  },
};

@Injectable()
export class StrategyRunnerService {
  private readonly logger = new Logger(StrategyRunnerService.name);

  constructor(private readonly strategyRegistry: StrategyRegistry) {}

  runStrategies(
    watchItem: WatchlistEntity,
    candles: Candle[],
    strategyConfigs: StrategyConfigEntity[],
  ): StrategySignal[] {
    const signals: StrategySignal[] = [];

    for (const config of strategyConfigs) {
      if (!config.enabled) {
        continue;
      }

      try {
        const strategy = this.strategyRegistry.get(
          config.strategyKey as StrategyKey,
        );
        const signal = strategy.run({
          symbol: watchItem.symbol,
          timeframe: watchItem.timeframe,
          candles,
          params: {
            ...this.getDefaultParams(config.strategyKey),
            ...this.readParamsJson(config.paramsJson),
          },
        });

        if (signal) {
          signals.push(signal);
        }
      } catch (error) {
        this.logStrategyError(config.strategyKey, watchItem, error);
      }
    }

    return signals;
  }

  private getDefaultParams(strategyKey: string): Record<string, unknown> {
    return DEFAULT_STRATEGY_PARAMS[strategyKey as StrategyKey] ?? {};
  }

  private readParamsJson(
    paramsJson: Record<string, unknown> | undefined,
  ): Record<string, unknown> {
    return paramsJson && typeof paramsJson === 'object' ? paramsJson : {};
  }

  private logStrategyError(
    strategyKey: string,
    watchItem: WatchlistEntity,
    error: unknown,
  ): void {
    const message = error instanceof Error ? error.message : String(error);
    const trace = error instanceof Error ? error.stack : undefined;

    this.logger.error(
      `Strategy ${strategyKey} failed for ${watchItem.symbol} ${watchItem.timeframe}: ${message}`,
      trace,
    );
  }
}
