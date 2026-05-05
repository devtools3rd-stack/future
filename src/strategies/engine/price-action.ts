import { Candle } from '../../symbols/binance.service';
import { readNumberParam } from './indicators';
import { StrategyDirection } from './strategy.types';

export type SmartMoneySetup = {
  direction: StrategyDirection;
  price: number;
  sweepPrice: number;
  reasonSide: 'bullish' | 'bearish';
  meta: {
    displacementPercent: number;
    fairValueGap: boolean;
    liquiditySweep: 'buy-side' | 'sell-side';
    rangeHigh: number;
    rangeLow: number;
    rangeMidpoint: number;
    swingHigh: number;
    swingLow: number;
  };
};

export function detectSmartMoneySetup(
  candles: Candle[],
  params: Record<string, unknown>,
): SmartMoneySetup | null {
  const liquidityLookback = readPositiveIntegerParam(
    params,
    'liquidityLookback',
    20,
  );
  const swingLookback = readPositiveIntegerParam(params, 'swingLookback', 5);
  const minDisplacementPercent = readNumberParam(
    params,
    'minDisplacementPercent',
    0.3,
  );
  const requireFairValueGap = readBooleanParam(
    params,
    'requireFairValueGap',
    true,
  );
  const usePremiumDiscount = readBooleanParam(
    params,
    'usePremiumDiscount',
    true,
  );

  if (candles.length < Math.max(liquidityLookback, swingLookback) + 3) {
    return null;
  }

  const setupCandles = candles.slice(-3);
  const latest = setupCandles[2];
  const rangeEndIndex = candles.length - setupCandles.length;
  const rangeCandles = candles.slice(
    Math.max(0, rangeEndIndex - liquidityLookback),
    rangeEndIndex,
  );
  const swingCandles = candles.slice(
    Math.max(0, rangeEndIndex - swingLookback),
    rangeEndIndex,
  );

  if (rangeCandles.length === 0 || swingCandles.length === 0) {
    return null;
  }

  const rangeHigh = Math.max(...rangeCandles.map((candle) => candle.high));
  const rangeLow = Math.min(...rangeCandles.map((candle) => candle.low));
  const rangeMidpoint = (rangeHigh + rangeLow) / 2;
  const swingHigh = Math.max(...swingCandles.map((candle) => candle.high));
  const swingLow = Math.min(...swingCandles.map((candle) => candle.low));
  const sweepLow = Math.min(...setupCandles.map((candle) => candle.low));
  const sweepHigh = Math.max(...setupCandles.map((candle) => candle.high));
  const bullishFairValueGap = setupCandles[0].high < latest.low;
  const bearishFairValueGap = setupCandles[0].low > latest.high;
  const displacementPercent = calculateDisplacementPercent(latest);

  if (displacementPercent < minDisplacementPercent) {
    return null;
  }

  if (
    sweepLow < rangeLow &&
    latest.close > latest.open &&
    latest.close > swingHigh
  ) {
    if (requireFairValueGap && !bullishFairValueGap) {
      return null;
    }

    if (usePremiumDiscount && sweepLow > rangeMidpoint) {
      return null;
    }

    return {
      direction: 'LONG',
      price: latest.close,
      sweepPrice: sweepLow,
      reasonSide: 'bullish',
      meta: {
        displacementPercent,
        fairValueGap: bullishFairValueGap,
        liquiditySweep: 'sell-side',
        rangeHigh,
        rangeLow,
        rangeMidpoint,
        swingHigh,
        swingLow,
      },
    };
  }

  if (
    sweepHigh > rangeHigh &&
    latest.close < latest.open &&
    latest.close < swingLow
  ) {
    if (requireFairValueGap && !bearishFairValueGap) {
      return null;
    }

    if (usePremiumDiscount && sweepHigh < rangeMidpoint) {
      return null;
    }

    return {
      direction: 'SHORT',
      price: latest.close,
      sweepPrice: sweepHigh,
      reasonSide: 'bearish',
      meta: {
        displacementPercent,
        fairValueGap: bearishFairValueGap,
        liquiditySweep: 'buy-side',
        rangeHigh,
        rangeLow,
        rangeMidpoint,
        swingHigh,
        swingLow,
      },
    };
  }

  return null;
}

export function readBooleanParam(
  params: Record<string, unknown>,
  key: string,
  fallback: boolean,
): boolean {
  const value = params[key];

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') {
      return true;
    }

    if (value.toLowerCase() === 'false') {
      return false;
    }
  }

  return fallback;
}

export function readStringParam<T extends string>(
  params: Record<string, unknown>,
  key: string,
  fallback: T,
  allowedValues: readonly T[],
): T {
  const value = params[key];

  return typeof value === 'string' && allowedValues.includes(value as T)
    ? (value as T)
    : fallback;
}

function readPositiveIntegerParam(
  params: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const value = readNumberParam(params, key, fallback);

  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function calculateDisplacementPercent(candle: Candle): number {
  if (candle.open === 0) {
    return 0;
  }

  return Number(
    (
      (Math.abs(candle.close - candle.open) / Math.abs(candle.open)) *
      100
    ).toFixed(4),
  );
}
