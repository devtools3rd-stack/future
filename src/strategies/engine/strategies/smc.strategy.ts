import { Injectable } from '@nestjs/common';
import { StrategyKey } from '../../strategy-config.constants';
import { readNumberParam } from '../indicators';
import { detectSmartMoneySetup } from '../price-action';
import {
  StrategyContext,
  StrategyRunner,
  StrategySignal,
} from '../strategy.types';

@Injectable()
export class SmcStrategy implements StrategyRunner {
  strategyKey = StrategyKey.SMC;

  run(context: StrategyContext): StrategySignal | null {
    const setup = detectSmartMoneySetup(context.candles, context.params);

    if (!setup) {
      return null;
    }

    const minRiskReward = Math.max(
      1,
      readNumberParam(context.params, 'minRiskReward', 2),
    );
    const riskLevels = this.calculateRiskLevels(
      setup.direction,
      setup.price,
      setup.sweepPrice,
      minRiskReward,
    );

    if (!riskLevels) {
      return null;
    }

    return {
      strategyKey: this.strategyKey,
      direction: setup.direction,
      price: setup.price,
      stopLoss: riskLevels.stopLoss,
      takeProfit: riskLevels.takeProfit,
      reason: `SMC ${setup.reasonSide} liquidity sweep with displacement confirmation`,
      meta: {
        ...setup.meta,
        minRiskReward,
        stopLoss: riskLevels.stopLoss,
        takeProfit: riskLevels.takeProfit,
      },
    };
  }

  private calculateRiskLevels(
    direction: 'LONG' | 'SHORT',
    entry: number,
    sweepPrice: number,
    minRiskReward: number,
  ): { stopLoss: number; takeProfit: number } | null {
    if (direction === 'LONG') {
      const risk = entry - sweepPrice;

      if (risk <= 0) {
        return null;
      }

      return {
        stopLoss: sweepPrice,
        takeProfit: entry + risk * minRiskReward,
      };
    }

    const risk = sweepPrice - entry;

    if (risk <= 0) {
      return null;
    }

    return {
      stopLoss: sweepPrice,
      takeProfit: entry - risk * minRiskReward,
    };
  }
}
