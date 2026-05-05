import { Candle } from '../../../symbols/binance.service';
import { StrategyKey } from '../../strategy-config.constants';
import { SmcStrategy } from './smc.strategy';

const baseTime = Date.UTC(2026, 0, 1, 7, 0);

function candle(
  index: number,
  open: number,
  high: number,
  low: number,
  close: number,
): Candle {
  return {
    openTime: baseTime + index * 60_000,
    open,
    high,
    low,
    close,
    volume: 1,
    closeTime: baseTime + index * 60_000 + 59_999,
  };
}

function rangeCandles(): Candle[] {
  return Array.from({ length: 20 }, (_, index) =>
    candle(index, 100, 105, 95, 100),
  );
}

function bullishSetupCandles(): Candle[] {
  return [
    ...rangeCandles(),
    candle(20, 96, 97, 92, 95),
    candle(21, 98, 101, 98, 100),
    candle(22, 102, 109, 100, 108),
  ];
}

function bearishSetupCandles(): Candle[] {
  return [
    ...rangeCandles(),
    candle(20, 104, 108, 103, 105),
    candle(21, 102, 103, 99, 100),
    candle(22, 98, 100, 91, 92),
  ];
}

describe('SmcStrategy', () => {
  it('emits LONG after a sell-side liquidity sweep, fair value gap, and bullish structure shift', () => {
    const strategy = new SmcStrategy();

    const result = strategy.run({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      candles: bullishSetupCandles(),
      params: {
        swingLookback: 5,
        liquidityLookback: 20,
        minDisplacementPercent: 0.3,
        requireFairValueGap: true,
        usePremiumDiscount: true,
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        strategyKey: StrategyKey.SMC,
        direction: 'LONG',
        price: 108,
        stopLoss: 92,
        takeProfit: 140,
        reason: 'SMC bullish liquidity sweep with displacement confirmation',
      }),
    );
    expect(result?.meta).toEqual(
      expect.objectContaining({
        fairValueGap: true,
        liquiditySweep: 'sell-side',
        rangeHigh: 105,
        rangeLow: 95,
      }),
    );
  });

  it('emits SHORT after a buy-side liquidity sweep, fair value gap, and bearish structure shift', () => {
    const strategy = new SmcStrategy();

    const result = strategy.run({
      symbol: 'ETHUSDT',
      timeframe: '15m',
      candles: bearishSetupCandles(),
      params: {
        swingLookback: 5,
        liquidityLookback: 20,
        minDisplacementPercent: 0.3,
        requireFairValueGap: true,
        usePremiumDiscount: true,
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        strategyKey: StrategyKey.SMC,
        direction: 'SHORT',
        price: 92,
        stopLoss: 108,
        takeProfit: 60,
        reason: 'SMC bearish liquidity sweep with displacement confirmation',
      }),
    );
    expect(result?.meta).toEqual(
      expect.objectContaining({
        fairValueGap: true,
        liquiditySweep: 'buy-side',
        rangeHigh: 105,
        rangeLow: 95,
      }),
    );
  });

  it('returns null when a fair value gap is required but missing', () => {
    const strategy = new SmcStrategy();
    const candles = bullishSetupCandles();
    candles[candles.length - 1] = candle(22, 102, 109, 96, 108);

    const result = strategy.run({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      candles,
      params: {
        swingLookback: 5,
        liquidityLookback: 20,
        minDisplacementPercent: 0.3,
        requireFairValueGap: true,
        usePremiumDiscount: true,
      },
    });

    expect(result).toBeNull();
  });

  it('allows the same setup when fair value gap confirmation is disabled', () => {
    const strategy = new SmcStrategy();
    const candles = bullishSetupCandles();
    candles[candles.length - 1] = candle(22, 102, 109, 96, 108);

    const result = strategy.run({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      candles,
      params: {
        swingLookback: 5,
        liquidityLookback: 20,
        minDisplacementPercent: 0.3,
        requireFairValueGap: false,
        usePremiumDiscount: true,
      },
    });

    expect(result?.direction).toBe('LONG');
    expect(result?.meta).toEqual(
      expect.objectContaining({ fairValueGap: false }),
    );
  });
});
