import { BadRequestException } from '@nestjs/common';
import { Candle } from '../../symbols/binance.service';
import { StrategyKey } from '../strategy-config.constants';
import { StrategyRegistry } from './strategy-registry';
import { StrategyContext, StrategyRunner } from './strategy.types';

function createCandles(closes: number[]): Candle[] {
  return closes.map((close, index) => ({
    openTime: index,
    open: close,
    high: close,
    low: close,
    close,
    volume: 1,
    closeTime: index,
  }));
}

function createRunner(strategyKey: StrategyKey): {
  runner: StrategyRunner;
  run: jest.Mock;
} {
  const run = jest.fn((context: StrategyContext) => ({
    strategyKey,
    direction: 'LONG' as const,
    price: context.candles.at(-1)?.close ?? 0,
    reason: `${strategyKey} signal`,
  }));

  return {
    runner: {
      strategyKey,
      run,
    },
    run,
  };
}

describe('StrategyRegistry', () => {
  it('returns a strategy by key', () => {
    const { runner } = createRunner(StrategyKey.EMA_CROSS);
    const registry = new StrategyRegistry([runner]);

    expect(registry.get(StrategyKey.EMA_CROSS)).toBe(runner);
  });

  it('returns all registered strategies', () => {
    const runners = [
      createRunner(StrategyKey.EMA_CROSS).runner,
      createRunner(StrategyKey.RSI_EXTREME).runner,
    ];
    const registry = new StrategyRegistry(runners);

    expect(registry.getAll()).toEqual(runners);
  });

  it('runs a strategy by key', () => {
    const { runner, run } = createRunner(StrategyKey.MACD_CROSS);
    const registry = new StrategyRegistry([runner]);
    const context: StrategyContext = {
      symbol: 'BTCUSDT',
      timeframe: '1h',
      candles: createCandles([10, 11]),
      params: {},
    };

    const result = registry.run(StrategyKey.MACD_CROSS, context);

    expect(run).toHaveBeenCalledWith(context);
    expect(result).toEqual({
      strategyKey: StrategyKey.MACD_CROSS,
      direction: 'LONG',
      price: 11,
      reason: 'MACD_CROSS signal',
    });
  });

  it('throws BadRequestException for unsupported strategy keys', () => {
    const registry = new StrategyRegistry([]);

    expect(() => registry.get('UNKNOWN' as StrategyKey)).toThrow(
      BadRequestException,
    );
  });
});
