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

  it('returns LONG when RSI is oversold', () => {
    const strategy = new RsiExtremeStrategy();

    const result = strategy.run({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      candles: createCandles([10, 9, 8, 7]),
      params: { period: 3, oversold: 30, overbought: 70 },
    });

    expect(result).toEqual({
      strategyKey: StrategyKey.RSI_EXTREME,
      direction: 'LONG',
      price: 7,
      reason: 'RSI is oversold',
      meta: {
        period: 3,
        oversold: 30,
        overbought: 70,
        rsi: 0,
      },
    });
  });

  it('returns SHORT when RSI is overbought', () => {
    const strategy = new RsiExtremeStrategy();

    const result = strategy.run({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      candles: createCandles([10, 11, 12, 13]),
      params: { period: 3, oversold: 30, overbought: 70 },
    });

    expect(result?.strategyKey).toBe(StrategyKey.RSI_EXTREME);
    expect(result?.direction).toBe('SHORT');
    expect(result?.price).toBe(13);
    expect(result?.reason).toBe('RSI is overbought');
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
});
