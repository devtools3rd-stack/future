import { Candle } from '../../../symbols/binance.service';
import { StrategyKey } from '../../strategy-config.constants';
import { MacdCrossStrategy } from './macd-cross.strategy';

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

describe('MacdCrossStrategy', () => {
  it('returns null when candles are not enough', () => {
    const strategy = new MacdCrossStrategy();

    const result = strategy.run({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      candles: createCandles([10, 11, 12]),
      params: { fastPeriod: 2, slowPeriod: 3, signalPeriod: 2 },
    });

    expect(result).toBeNull();
  });

  it('returns LONG when MACD crosses above signal line with positive histogram confirmation', () => {
    const strategy = new MacdCrossStrategy();

    const result = strategy.run({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      candles: createCandles([10, 10, 10, 8, 12]),
      params: { fastPeriod: 2, slowPeriod: 3, signalPeriod: 2 },
    });

    expect(result?.strategyKey).toBe(StrategyKey.MACD_CROSS);
    expect(result?.direction).toBe('LONG');
    expect(result?.price).toBe(12);
    expect(result?.reason).toBe(
      'MACD crossed above signal line with positive histogram 0.20',
    );
    expect(result?.meta).toMatchObject({
      fastPeriod: 2,
      slowPeriod: 3,
      signalPeriod: 2,
    });
    expect(result?.meta?.macd).toEqual(expect.any(Number));
    expect(result?.meta?.signal).toEqual(expect.any(Number));
    expect(result?.meta?.histogram).toBeCloseTo(0.2, 2);
  });

  it('returns SHORT when MACD crosses below signal line with negative histogram confirmation', () => {
    const strategy = new MacdCrossStrategy();

    const result = strategy.run({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      candles: createCandles([10, 10, 10, 12, 8]),
      params: { fastPeriod: 2, slowPeriod: 3, signalPeriod: 2 },
    });

    expect(result?.strategyKey).toBe(StrategyKey.MACD_CROSS);
    expect(result?.direction).toBe('SHORT');
    expect(result?.price).toBe(8);
    expect(result?.reason).toBe(
      'MACD crossed below signal line with negative histogram -0.20',
    );
    expect(result?.meta?.histogram).toBeCloseTo(-0.2, 2);
  });

  it('returns null when there is no MACD cross', () => {
    const strategy = new MacdCrossStrategy();

    const result = strategy.run({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      candles: createCandles([10, 11, 12, 13, 14]),
      params: { fastPeriod: 2, slowPeriod: 3, signalPeriod: 2 },
    });

    expect(result).toBeNull();
  });
});
