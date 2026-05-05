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
    const { runner } = createRunner(StrategyKey.SMC);
    const registry = new StrategyRegistry([runner]);

    expect(registry.get(StrategyKey.SMC)).toBe(runner);
  });

  it('returns all registered strategies', () => {
    const runners = [
      createRunner(StrategyKey.SMC).runner,
      createRunner(StrategyKey.ICT).runner,
    ];
    const registry = new StrategyRegistry(runners);

    expect(registry.getAll()).toEqual(runners);
  });

  it('runs a strategy by key', () => {
    const { runner, run } = createRunner(StrategyKey.ICT);
    const registry = new StrategyRegistry([runner]);
    const context: StrategyContext = {
      symbol: 'BTCUSDT',
      timeframe: '1h',
      candles: createCandles([10, 11]),
      params: {},
    };

    const result = registry.run(StrategyKey.ICT, context);

    expect(run).toHaveBeenCalledWith(context);
    expect(result).toEqual({
      strategyKey: StrategyKey.ICT,
      direction: 'LONG',
      price: 11,
      reason: 'ICT signal',
    });
  });

  it('throws BadRequestException for unsupported strategy keys', () => {
    const registry = new StrategyRegistry([]);

    expect(() => registry.get('UNKNOWN' as StrategyKey)).toThrow(
      BadRequestException,
    );
  });
});
