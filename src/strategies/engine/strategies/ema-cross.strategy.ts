import { Injectable } from '@nestjs/common';
import { StrategyKey } from '../../strategy-config.constants';
import { ema, getCloses, getLastClose, readNumberParam } from '../indicators';
import {
  StrategyContext,
  StrategyRunner,
  StrategySignal,
} from '../strategy.types';

@Injectable()
export class EmaCrossStrategy implements StrategyRunner {
  strategyKey = StrategyKey.EMA_CROSS;

  run(context: StrategyContext): StrategySignal | null {
    const fastPeriod = readNumberParam(context.params, 'fastPeriod', 12);
    const slowPeriod = readNumberParam(context.params, 'slowPeriod', 26);

    if (context.candles.length < slowPeriod + 2) {
      return null;
    }

    const closes = getCloses(context.candles);
    const fastEma = ema(closes, fastPeriod);
    const slowEma = ema(closes, slowPeriod);
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
        'Fast EMA crossed above slow EMA',
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
        'Fast EMA crossed below slow EMA',
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
