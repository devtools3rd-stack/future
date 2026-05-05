import { Injectable } from '@nestjs/common';
import { StrategyKey } from '../../strategy-config.constants';
import { detectSmartMoneySetup, readStringParam } from '../price-action';
import { readNumberParam } from '../indicators';
import {
  StrategyContext,
  StrategyRunner,
  StrategySignal,
} from '../strategy.types';

type KillZone = 'any' | 'london' | 'newYork';

const KILL_ZONES: readonly KillZone[] = ['any', 'london', 'newYork'];

@Injectable()
export class IctStrategy implements StrategyRunner {
  strategyKey = StrategyKey.ICT;

  run(context: StrategyContext): StrategySignal | null {
    const killZone = readStringParam(
      context.params,
      'killZone',
      'any',
      KILL_ZONES,
    );

    if (!this.isInsideKillZone(context.candles.at(-1)?.openTime, killZone)) {
      return null;
    }

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
      reason: `ICT ${setup.reasonSide} liquidity sweep inside ${this.formatKillZone(killZone)}`,
      meta: {
        ...setup.meta,
        killZone,
        minRiskReward,
        stopLoss: riskLevels.stopLoss,
        takeProfit: riskLevels.takeProfit,
      },
    };
  }

  private isInsideKillZone(
    openTime: number | undefined,
    killZone: KillZone,
  ): boolean {
    if (killZone === 'any') {
      return true;
    }

    if (openTime === undefined) {
      return false;
    }

    const candleTime = new Date(openTime);
    const utcMinutes =
      candleTime.getUTCHours() * 60 + candleTime.getUTCMinutes();

    if (killZone === 'london') {
      return utcMinutes >= 7 * 60 && utcMinutes < 10 * 60;
    }

    return utcMinutes >= 12 * 60 && utcMinutes < 15 * 60;
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

  private formatKillZone(killZone: KillZone): string {
    if (killZone === 'london') {
      return 'London kill zone';
    }

    if (killZone === 'newYork') {
      return 'New York kill zone';
    }

    return 'active session';
  }
}
