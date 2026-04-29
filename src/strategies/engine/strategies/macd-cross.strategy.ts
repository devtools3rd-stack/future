import { Injectable } from '@nestjs/common';
import { StrategyKey } from '../../strategy-config.constants';
import {
  calculateMACD,
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
export class MacdCrossStrategy implements StrategyRunner {
  strategyKey = StrategyKey.MACD_CROSS;

  run(context: StrategyContext): StrategySignal | null {
    const fastPeriod = readNumberParam(context.params, 'fastPeriod', 12);
    const slowPeriod = readNumberParam(context.params, 'slowPeriod', 26);
    const signalPeriod = readNumberParam(context.params, 'signalPeriod', 9);

    if (context.candles.length < slowPeriod + signalPeriod) {
      return null;
    }

    const closes = getCloses(context.candles);
    const macdValues = calculateMACD(
      closes,
      fastPeriod,
      slowPeriod,
      signalPeriod,
    );
    const previousIndex = closes.length - 2;
    const currentIndex = closes.length - 1;
    const previousValue = macdValues[previousIndex];
    const currentValue = macdValues[currentIndex];

    if (!previousValue || !currentValue) {
      return null;
    }

    if (
      previousValue.macd <= previousValue.signal &&
      currentValue.macd > currentValue.signal &&
      currentValue.histogram > 0
    ) {
      return this.createSignal(
        context,
        'LONG',
        `MACD crossed above signal line with positive histogram ${this.formatNumber(currentValue.histogram)}`,
        {
          fastPeriod,
          slowPeriod,
          signalPeriod,
          macd: currentValue.macd,
          signal: currentValue.signal,
          histogram: currentValue.histogram,
        },
      );
    }

    if (
      previousValue.macd >= previousValue.signal &&
      currentValue.macd < currentValue.signal &&
      currentValue.histogram < 0
    ) {
      return this.createSignal(
        context,
        'SHORT',
        `MACD crossed below signal line with negative histogram ${this.formatNumber(currentValue.histogram)}`,
        {
          fastPeriod,
          slowPeriod,
          signalPeriod,
          macd: currentValue.macd,
          signal: currentValue.signal,
          histogram: currentValue.histogram,
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
