import { BadRequestException, Injectable } from '@nestjs/common';
import { StrategyKey } from '../strategy-config.constants';
import { IctStrategy } from './strategies/ict.strategy';
import { SmcStrategy } from './strategies/smc.strategy';
import {
  StrategyContext,
  StrategyRunner,
  StrategySignal,
} from './strategy.types';

@Injectable()
export class StrategyRegistry {
  private readonly strategiesByKey: Map<StrategyKey, StrategyRunner>;

  constructor(
    strategies: StrategyRunner[] = [new SmcStrategy(), new IctStrategy()],
  ) {
    this.strategiesByKey = new Map(
      strategies.map((strategy) => [strategy.strategyKey, strategy]),
    );
  }

  get(strategyKey: StrategyKey): StrategyRunner {
    const strategy = this.strategiesByKey.get(strategyKey);

    if (!strategy) {
      throw new BadRequestException(`Unsupported strategy ${strategyKey}`);
    }

    return strategy;
  }

  getAll(): StrategyRunner[] {
    return Array.from(this.strategiesByKey.values());
  }

  run(
    strategyKey: StrategyKey,
    context: StrategyContext,
  ): StrategySignal | null {
    return this.get(strategyKey).run(context);
  }
}
