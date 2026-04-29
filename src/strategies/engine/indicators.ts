import { Candle } from '../../symbols/binance.service';

export function getCloses(candles: Candle[]): number[] {
  return candles.map((candle) => candle.close);
}

export function getLastClose(candles: Candle[]): number {
  return candles[candles.length - 1].close;
}

export type MacdValue = {
  macd: number;
  signal: number;
  histogram: number;
};

export function calculateEMA(values: number[], period: number): number[] {
  if (!isValidPeriod(period) || values.length < period) {
    return [];
  }

  const multiplier = 2 / (period + 1);
  const [firstValue, ...remainingValues] = values;
  const result = [firstValue];

  for (const value of remainingValues) {
    const previous = result[result.length - 1];
    result.push((value - previous) * multiplier + previous);
  }

  return result;
}

export function calculateRSI(
  values: number[],
  period: number,
): Array<number | null> {
  if (!isValidPeriod(period) || values.length < period + 1) {
    return [];
  }

  return values.map((_, index) => {
    if (index < period) {
      return null;
    }

    return calculateRsiWindow(values.slice(index - period, index + 1), period);
  });
}

export function calculateMACD(
  values: number[],
  fastPeriod: number,
  slowPeriod: number,
  signalPeriod: number,
): Array<MacdValue | null> {
  if (
    !isValidPeriod(fastPeriod) ||
    !isValidPeriod(slowPeriod) ||
    !isValidPeriod(signalPeriod) ||
    fastPeriod >= slowPeriod ||
    values.length < slowPeriod + signalPeriod
  ) {
    return [];
  }

  const fastEma = calculateEMA(values, fastPeriod);
  const slowEma = calculateEMA(values, slowPeriod);
  const macdLine = values.map((_, index) => fastEma[index] - slowEma[index]);
  const signalLine = calculateEMA(macdLine, signalPeriod);

  return values.map((_, index) => {
    if (index < slowPeriod) {
      return null;
    }

    const macd = macdLine[index];
    const signal = signalLine[index];

    return {
      macd,
      signal,
      histogram: macd - signal,
    };
  });
}

export function ema(values: number[], period: number): number[] {
  return calculateEMA(values, period);
}

export function rsi(values: number[], period: number): number | null {
  const valuesByIndex = calculateRSI(values, period);

  return valuesByIndex.at(-1) ?? null;
}

export function readNumberParam(
  params: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const value = params[key];

  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function calculateRsiWindow(values: number[], period: number): number {
  let gains = 0;
  let losses = 0;

  for (let index = 1; index < values.length; index += 1) {
    const change = values[index] - values[index - 1];

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

function isValidPeriod(period: number): boolean {
  return Number.isInteger(period) && period > 0;
}
