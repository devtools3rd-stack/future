import { Injectable } from '@nestjs/common';
import { StrategyKey } from '../../strategy-config.constants';
import {
  calculateRSI,
  getCloses,
  getLastClose,
  readNumberParam,
} from '../indicators';
import {
  StrategyContext,
  StrategyRunner,
  StrategySignal,
} from '../strategy.types';

@Injectable()
export class RsiExtremeStrategy implements StrategyRunner {
  strategyKey = StrategyKey.RSI_EXTREME;

  run(context: StrategyContext): StrategySignal | null {
    const period = readNumberParam(context.params, 'period', 14);
    const oversold = readNumberParam(context.params, 'oversold', 30);
    const overbought = readNumberParam(context.params, 'overbought', 70);

    if (context.candles.length < period + 2) {
      return null;
    }

    const rsiValues = calculateRSI(getCloses(context.candles), period);
    const previousRsi = rsiValues.at(-2);
    const currentRsi = rsiValues.at(-1);

    if (
      previousRsi === undefined ||
      previousRsi === null ||
      currentRsi === undefined ||
      currentRsi === null
    ) {
      return null;
    }

    if (previousRsi < oversold && currentRsi >= oversold) {
      return this.createSignal(
        context,
        'LONG',
        `RSI ${this.formatNumber(currentRsi)} crossed above oversold ${this.formatNumber(oversold)}`,
        {
          period,
          oversold,
          overbought,
          previousRsi,
          rsi: currentRsi,
        },
      );
    }

    if (previousRsi > overbought && currentRsi <= overbought) {
      return this.createSignal(
        context,
        'SHORT',
        `RSI ${this.formatNumber(currentRsi)} crossed below overbought ${this.formatNumber(overbought)}`,
        {
          period,
          oversold,
          overbought,
          previousRsi,
          rsi: currentRsi,
        },
      );
    }

    return null;
  }

  private createSignal(
    context: StrategyContext,
    direction: 'LONG' | 'SHORT',
    reason: string,
    meta: Record<string, unknown>,
  ): StrategySignal {
    return {
      strategyKey: this.strategyKey,
      direction,
      price: getLastClose(context.candles),
      reason,
      meta,
    };
  }

  private formatNumber(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
}
