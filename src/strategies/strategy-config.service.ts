import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { mapRepositoryError } from '../database/repository-error';
import { WatchlistService } from '../watchlist/watchlist.service';
import { StrategyConfigEntity } from './entities/strategy-config.entity';
import {
  DEFAULT_STRATEGY_CONFIGS,
  StrategyConfigView,
  StrategyKey,
} from './strategy-config.constants';

export type UpsertStrategyConfigInput = Pick<
  StrategyConfigEntity,
  'watchlistId' | 'enabled' | 'paramsJson'
> & {
  strategyKey: StrategyKey;
};

@Injectable()
export class StrategyConfigService {
  constructor(
    @InjectRepository(StrategyConfigEntity)
    private readonly strategyConfigRepository: Repository<StrategyConfigEntity>,
    private readonly watchlistService: WatchlistService,
  ) {}

  getConfigsByWatchlistId(
    watchlistId: string,
  ): Promise<StrategyConfigEntity[]> {
    return this.strategyConfigRepository.find({
      where: { watchlistId },
      order: { createdAt: 'DESC' },
    });
  }

  async upsertStrategyConfig(
    input: UpsertStrategyConfigInput,
  ): Promise<StrategyConfigEntity> {
    await this.ensureWatchItemExists(input.watchlistId);

    const existing = await this.strategyConfigRepository.findOne({
      where: {
        watchlistId: input.watchlistId,
        strategyKey: input.strategyKey,
      },
    });
    const strategyConfig = existing
      ? { ...existing, enabled: input.enabled, paramsJson: input.paramsJson }
      : this.strategyConfigRepository.create(input);

    try {
      return await this.strategyConfigRepository.save(strategyConfig);
    } catch (error) {
      mapRepositoryError(error, 'Strategy config already exists');
    }
  }

  getEnabledStrategiesByWatchlistId(
    watchlistId: string,
  ): Promise<StrategyConfigEntity[]> {
    return this.strategyConfigRepository.find({
      where: { watchlistId, enabled: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getConfigsWithDefaultsByWatchlistId(
    watchlistId: string,
  ): Promise<StrategyConfigView[]> {
    await this.ensureWatchItemExists(watchlistId);

    const savedConfigs = await this.getConfigsByWatchlistId(watchlistId);
    const savedByKey = new Map(
      savedConfigs.map((config) => [config.strategyKey, config]),
    );

    return DEFAULT_STRATEGY_CONFIGS.map((defaultConfig) => {
      const savedConfig = savedByKey.get(defaultConfig.strategyKey);

      if (!savedConfig) {
        return defaultConfig;
      }

      return {
        strategyKey: defaultConfig.strategyKey,
        enabled: savedConfig.enabled,
        paramsJson: savedConfig.paramsJson,
      };
    });
  }

  private async ensureWatchItemExists(watchlistId: string): Promise<void> {
    await this.watchlistService.updateWatchItem(watchlistId, {});
  }
}
