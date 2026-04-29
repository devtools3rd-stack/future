import { Candle } from '../../../symbols/binance.service';
import { StrategyKey } from '../../strategy-config.constants';
import { EmaCrossStrategy } from './ema-cross.strategy';

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

describe('EmaCrossStrategy', () => {
  it('returns null when candles are not enough', () => {
    const strategy = new EmaCrossStrategy();

    const result = strategy.run({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      candles: createCandles([10, 11]),
      params: { fastPeriod: 2, slowPeriod: 3 },
    });

    expect(result).toBeNull();
  });

  it('returns LONG when fast EMA crosses above slow EMA', () => {
    const strategy = new EmaCrossStrategy();

    const result = strategy.run({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      candles: createCandles([10, 10, 10, 8, 12]),
      params: { fastPeriod: 2, slowPeriod: 3 },
    });

    expect(result).toEqual({
      strategyKey: StrategyKey.EMA_CROSS,
      direction: 'LONG',
      price: 12,
      reason: 'Fast EMA crossed above slow EMA',
      meta: {
        fastPeriod: 2,
        slowPeriod: 3,
        fastEma: expect.any(Number) as number,
        slowEma: expect.any(Number) as number,
      },
    });
  });

  it('returns SHORT when fast EMA crosses below slow EMA', () => {
    const strategy = new EmaCrossStrategy();

    const result = strategy.run({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      candles: createCandles([10, 10, 10, 12, 8]),
      params: { fastPeriod: 2, slowPeriod: 3 },
    });

    expect(result?.strategyKey).toBe(StrategyKey.EMA_CROSS);
    expect(result?.direction).toBe('SHORT');
    expect(result?.price).toBe(8);
    expect(result?.reason).toBe('Fast EMA crossed below slow EMA');
  });

  it('returns null when there is no EMA cross', () => {
    const strategy = new EmaCrossStrategy();

    const result = strategy.run({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      candles: createCandles([10, 11, 12, 13, 14]),
      params: { fastPeriod: 2, slowPeriod: 3 },
    });

    expect(result).toBeNull();
  });
});
