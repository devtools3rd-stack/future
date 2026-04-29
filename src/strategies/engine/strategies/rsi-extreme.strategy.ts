import { Injectable } from '@nestjs/common';
import { StrategyKey } from '../../strategy-config.constants';
import { getCloses, getLastClose, readNumberParam, rsi } from '../indicators';
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

    if (context.candles.length < period + 1) {
      return null;
    }

    const currentRsi = rsi(getCloses(context.candles), period);

    if (currentRsi === null) {
      return null;
    }

    if (currentRsi <= oversold) {
      return this.createSignal(context, 'LONG', 'RSI is oversold', {
        period,
        oversold,
        overbought,
        rsi: currentRsi,
      });
    }

    if (currentRsi >= overbought) {
      return this.createSignal(context, 'SHORT', 'RSI is overbought', {
        period,
        oversold,
        overbought,
        rsi: currentRsi,
      });
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
