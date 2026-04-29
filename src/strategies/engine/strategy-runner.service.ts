import { Injectable, Logger } from '@nestjs/common';
import { Candle } from '../../symbols/binance.service';
import { WatchlistEntity } from '../../watchlist/entities/watchlist.entity';
import { StrategyConfigEntity } from '../entities/strategy-config.entity';
import { StrategyKey } from '../strategy-config.constants';
import { StrategyRegistry } from './strategy-registry';
import { StrategySignal } from './strategy.types';

const DEFAULT_STRATEGY_PARAMS: Record<StrategyKey, Record<string, unknown>> = {
  [StrategyKey.EMA_CROSS]: {
    fastPeriod: 9,
    slowPeriod: 21,
  },
  [StrategyKey.RSI_EXTREME]: {
    period: 14,
    oversold: 30,
    overbought: 70,
  },
  [StrategyKey.MACD_CROSS]: {
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
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
