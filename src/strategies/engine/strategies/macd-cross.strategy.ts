import { Injectable } from '@nestjs/common';
import { StrategyKey } from '../../strategy-config.constants';
import { ema, getCloses, getLastClose, readNumberParam } from '../indicators';
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
    const fastEma = ema(closes, fastPeriod);
    const slowEma = ema(closes, slowPeriod);
    const macdLine = closes.map((_, index) => fastEma[index] - slowEma[index]);
    const signalLine = ema(macdLine, signalPeriod);
    const previousIndex = closes.length - 2;
    const currentIndex = closes.length - 1;
    const previousMacd = macdLine[previousIndex];
    const previousSignal = signalLine[previousIndex];
    const currentMacd = macdLine[currentIndex];
    const currentSignal = signalLine[currentIndex];

    if (previousMacd <= previousSignal && currentMacd > currentSignal) {
      return this.createSignal(
        context,
        'LONG',
        'MACD crossed above signal line',
        {
          fastPeriod,
          slowPeriod,
          signalPeriod,
          macd: currentMacd,
          signal: currentSignal,
        },
      );
    }

    if (previousMacd >= previousSignal && currentMacd < currentSignal) {
      return this.createSignal(
        context,
        'SHORT',
        'MACD crossed below signal line',
        {
          fastPeriod,
          slowPeriod,
          signalPeriod,
          macd: currentMacd,
          signal: currentSignal,
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
