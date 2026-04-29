import { Injectable } from '@nestjs/common';
import { StrategyKey } from '../../strategy-config.constants';
import {
  calculateEMA,
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
export class EmaCrossStrategy implements StrategyRunner {
  strategyKey = StrategyKey.EMA_CROSS;

  run(context: StrategyContext): StrategySignal | null {
    const fastPeriod = readNumberParam(context.params, 'fastPeriod', 9);
    const slowPeriod = readNumberParam(context.params, 'slowPeriod', 21);

    if (context.candles.length < slowPeriod + 2) {
      return null;
    }

    const closes = getCloses(context.candles);
    const fastEma = calculateEMA(closes, fastPeriod);
    const slowEma = calculateEMA(closes, slowPeriod);
    const previousIndex = closes.length - 2;
    const currentIndex = closes.length - 1;
    const previousFast = fastEma[previousIndex];
    const previousSlow = slowEma[previousIndex];
    const currentFast = fastEma[currentIndex];
    const currentSlow = slowEma[currentIndex];

    if (previousFast <= previousSlow && currentFast > currentSlow) {
      return this.createSignal(
        context,
        'LONG',
        `EMA ${fastPeriod} crossed above EMA ${slowPeriod}`,
        {
          fastPeriod,
          slowPeriod,
          fastEma: currentFast,
          slowEma: currentSlow,
        },
      );
    }

    if (previousFast >= previousSlow && currentFast < currentSlow) {
      return this.createSignal(
        context,
        'SHORT',
        `EMA ${fastPeriod} crossed below EMA ${slowPeriod}`,
        {
          fastPeriod,
          slowPeriod,
          fastEma: currentFast,
          slowEma: currentSlow,
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
}
