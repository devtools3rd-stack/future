import { Candle } from '../../../symbols/binance.service';
import { StrategyKey } from '../../strategy-config.constants';
import { RsiExtremeStrategy } from './rsi-extreme.strategy';

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

describe('RsiExtremeStrategy', () => {
  it('returns null when candles are not enough', () => {
    const strategy = new RsiExtremeStrategy();

    const result = strategy.run({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      candles: createCandles([10, 9, 8]),
      params: { period: 3 },
    });

    expect(result).toBeNull();
  });

  it('returns LONG when RSI crosses back above oversold', () => {
    const strategy = new RsiExtremeStrategy();

    const result = strategy.run({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      candles: createCandles([10, 9, 8, 7, 8]),
      params: { period: 3, oversold: 30, overbought: 70 },
    });

    expect(result?.strategyKey).toBe(StrategyKey.RSI_EXTREME);
    expect(result?.direction).toBe('LONG');
    expect(result?.price).toBe(8);
    expect(result?.reason).toBe('RSI 33.33 crossed above oversold 30');
    expect(result?.meta).toMatchObject({
      period: 3,
      oversold: 30,
      overbought: 70,
      previousRsi: 0,
    });
    expect(result?.meta?.rsi).toBeCloseTo(33.33, 2);
  });

  it('returns SHORT when RSI crosses back below overbought', () => {
    const strategy = new RsiExtremeStrategy();

    const result = strategy.run({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      candles: createCandles([10, 11, 12, 13, 12]),
      params: { period: 3, oversold: 30, overbought: 70 },
    });

    expect(result?.strategyKey).toBe(StrategyKey.RSI_EXTREME);
    expect(result?.direction).toBe('SHORT');
    expect(result?.price).toBe(12);
    expect(result?.reason).toBe('RSI 66.67 crossed below overbought 70');
  });

  it('returns null when RSI is neutral', () => {
    const strategy = new RsiExtremeStrategy();

    const result = strategy.run({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      candles: createCandles([10, 11, 10, 11]),
      params: { period: 3, oversold: 30, overbought: 70 },
    });

    expect(result).toBeNull();
  });

  it('does not create a repeated LONG signal while RSI remains below oversold', () => {
    const strategy = new RsiExtremeStrategy();

    const result = strategy.run({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      candles: createCandles([10, 9, 8, 7, 6]),
      params: { period: 3, oversold: 30, overbought: 70 },
    });

    expect(result).toBeNull();
  });

  it('does not create a repeated SHORT signal while RSI remains above overbought', () => {
    const strategy = new RsiExtremeStrategy();

    const result = strategy.run({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      candles: createCandles([10, 11, 12, 13, 14]),
      params: { period: 3, oversold: 30, overbought: 70 },
    });

    expect(result).toBeNull();
  });
});
