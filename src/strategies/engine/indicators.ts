import { Candle } from '../../symbols/binance.service';

export function getCloses(candles: Candle[]): number[] {
  return candles.map((candle) => candle.close);
}

export function getLastClose(candles: Candle[]): number {
  return candles[candles.length - 1].close;
}

export function ema(values: number[], period: number): number[] {
  const multiplier = 2 / (period + 1);
  const [firstValue, ...remainingValues] = values;

  if (firstValue === undefined) {
    return [];
  }

  const result = [firstValue];

  for (const value of remainingValues) {
    const previous = result[result.length - 1];
    result.push((value - previous) * multiplier + previous);
  }

  return result;
}

export function rsi(values: number[], period: number): number | null {
  if (values.length < period + 1) {
    return null;
  }

  const recentValues = values.slice(-(period + 1));
  let gains = 0;
  let losses = 0;

  for (let index = 1; index < recentValues.length; index += 1) {
    const change = recentValues[index] - recentValues[index - 1];

    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  const averageGain = gains / period;
  const averageLoss = losses / period;

  if (averageLoss === 0) {
    return averageGain === 0 ? 50 : 100;
  }

  const relativeStrength = averageGain / averageLoss;

  return 100 - 100 / (1 + relativeStrength);
}

export function readNumberParam(
  params: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const value = params[key];

  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
