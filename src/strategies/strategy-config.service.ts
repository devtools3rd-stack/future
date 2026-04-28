import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { mapRepositoryError } from '../database/repository-error';
import { StrategyConfigEntity } from './entities/strategy-config.entity';

export type UpsertStrategyConfigInput = Pick<
  StrategyConfigEntity,
  'watchlistId' | 'strategyKey' | 'enabled' | 'paramsJson'
>;

@Injectable()
export class StrategyConfigService {
  constructor(
    @InjectRepository(StrategyConfigEntity)
    private readonly strategyConfigRepository: Repository<StrategyConfigEntity>,
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
}
