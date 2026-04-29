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
      reason: 'EMA 2 crossed above EMA 3',
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
    expect(result?.reason).toBe('EMA 2 crossed below EMA 3');
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

  it('uses EMA 9 and EMA 21 as default periods', () => {
    const strategy = new EmaCrossStrategy();

    const result = strategy.run({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      candles: createCandles([
        100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
        100, 100, 100, 100, 100, 100, 100, 80, 130,
      ]),
      params: {},
    });

    expect(result?.strategyKey).toBe(StrategyKey.EMA_CROSS);
    expect(result?.direction).toBe('LONG');
    expect(result?.reason).toBe('EMA 9 crossed above EMA 21');
    expect(result?.meta).toEqual(
      expect.objectContaining({
        fastPeriod: 9,
        slowPeriod: 21,
      }),
    );
  });

  it('does not create a repeated LONG signal when fast EMA is already above slow EMA', () => {
    const strategy = new EmaCrossStrategy();

    const result = strategy.run({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      candles: createCandles([10, 11, 12, 13, 14, 15]),
      params: { fastPeriod: 2, slowPeriod: 3 },
    });

    expect(result).toBeNull();
  });
});
