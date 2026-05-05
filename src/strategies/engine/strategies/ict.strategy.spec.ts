import { Candle } from '../../../symbols/binance.service';
import { StrategyKey } from '../../strategy-config.constants';
import { IctStrategy } from './ict.strategy';

function candle(
  index: number,
  openTime: number,
  open: number,
  high: number,
  low: number,
  close: number,
): Candle {
  return {
    openTime: openTime + index * 60_000,
    open,
    high,
    low,
    close,
    volume: 1,
    closeTime: openTime + index * 60_000 + 59_999,
  };
}

function bullishSetupCandles(openTime: number): Candle[] {
  const range = Array.from({ length: 20 }, (_, index) =>
    candle(index, openTime, 100, 105, 95, 100),
  );

  return [
    ...range,
    candle(20, openTime, 96, 97, 92, 95),
    candle(21, openTime, 98, 101, 98, 100),
    candle(22, openTime, 102, 109, 100, 108),
  ];
}

describe('IctStrategy', () => {
  it('emits a LONG signal when the setup confirms inside the London kill zone', () => {
    const strategy = new IctStrategy();
    const londonOpenTime = Date.UTC(2026, 0, 1, 7, 30);

    const result = strategy.run({
      symbol: 'BTCUSDT',
      timeframe: '5m',
      candles: bullishSetupCandles(londonOpenTime),
      params: {
        swingLookback: 5,
        liquidityLookback: 20,
        minDisplacementPercent: 0.25,
        killZone: 'london',
        requireFairValueGap: true,
        minRiskReward: 2,
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        strategyKey: StrategyKey.ICT,
        direction: 'LONG',
        price: 108,
        stopLoss: 92,
        takeProfit: 140,
        reason: 'ICT bullish liquidity sweep inside London kill zone',
      }),
    );
    expect(result?.meta).toEqual(
      expect.objectContaining({
        killZone: 'london',
        minRiskReward: 2,
        stopLoss: 92,
        takeProfit: 140,
      }),
    );
  });

  it('blocks signals outside the selected kill zone', () => {
    const strategy = new IctStrategy();
    const asiaOpenTime = Date.UTC(2026, 0, 1, 3, 0);

    const result = strategy.run({
      symbol: 'BTCUSDT',
      timeframe: '5m',
      candles: bullishSetupCandles(asiaOpenTime),
      params: {
        swingLookback: 5,
        liquidityLookback: 20,
        minDisplacementPercent: 0.25,
        killZone: 'london',
        requireFairValueGap: true,
        minRiskReward: 2,
      },
    });

    expect(result).toBeNull();
  });

  it('allows any kill zone when the kill zone filter is disabled', () => {
    const strategy = new IctStrategy();
    const asiaOpenTime = Date.UTC(2026, 0, 1, 3, 0);

    const result = strategy.run({
      symbol: 'BTCUSDT',
      timeframe: '5m',
      candles: bullishSetupCandles(asiaOpenTime),
      params: {
        swingLookback: 5,
        liquidityLookback: 20,
        minDisplacementPercent: 0.25,
        killZone: 'any',
        requireFairValueGap: true,
        minRiskReward: 2,
      },
    });

    expect(result?.strategyKey).toBe(StrategyKey.ICT);
    expect(result?.direction).toBe('LONG');
  });
});
