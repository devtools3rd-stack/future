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

  it('returns LONG when MACD crosses above signal line', () => {
    const strategy = new MacdCrossStrategy();

    const result = strategy.run({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      candles: createCandles([10, 10, 10, 8, 12]),
      params: { fastPeriod: 2, slowPeriod: 3, signalPeriod: 2 },
    });

    expect(result).toEqual({
      strategyKey: StrategyKey.MACD_CROSS,
      direction: 'LONG',
      price: 12,
      reason: 'MACD crossed above signal line',
      meta: {
        fastPeriod: 2,
        slowPeriod: 3,
        signalPeriod: 2,
        macd: expect.any(Number) as number,
        signal: expect.any(Number) as number,
      },
    });
  });

  it('returns SHORT when MACD crosses below signal line', () => {
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
    expect(result?.reason).toBe('MACD crossed below signal line');
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
