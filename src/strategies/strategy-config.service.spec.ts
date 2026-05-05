import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { WatchlistService } from '../watchlist/watchlist.service';
import { StrategyConfigEntity } from './entities/strategy-config.entity';
import {
  DEFAULT_STRATEGY_CONFIGS,
  StrategyKey,
} from './strategy-config.constants';
import { StrategyConfigService } from './strategy-config.service';

type MockRepository<T extends object> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

function createRepository(): MockRepository<StrategyConfigEntity> {
  return {
    create: jest.fn((input: Partial<StrategyConfigEntity>) => input),
    save: jest.fn((input: Partial<StrategyConfigEntity>) =>
      Promise.resolve(input),
    ),
    find: jest.fn(),
    findOne: jest.fn(),
  };
}

function createWatchlistService(): Pick<WatchlistService, 'updateWatchItem'> {
  return {
    updateWatchItem: jest.fn().mockResolvedValue({ id: 'watch-id' }),
  };
}

function createService(
  repository: MockRepository<StrategyConfigEntity>,
  watchlistService = createWatchlistService(),
): StrategyConfigService {
  return new StrategyConfigService(
    repository as unknown as Repository<StrategyConfigEntity>,
    watchlistService as WatchlistService,
  );
}

describe('StrategyConfigService', () => {
  it('gets configs by watchlist id', async () => {
    const repository = createRepository();
    const service = createService(repository);

    await service.getConfigsByWatchlistId('watch-id');

    expect(repository.find).toHaveBeenCalledWith({
      where: { watchlistId: 'watch-id' },
      order: { createdAt: 'DESC' },
    });
  });

  it('gets enabled configs by watchlist id', async () => {
    const repository = createRepository();
    const service = createService(repository);

    await service.getEnabledStrategiesByWatchlistId('watch-id');

    const [findOptions] = repository.find?.mock.calls[0] as [
      {
        where: {
          watchlistId: string;
          enabled: boolean;
          strategyKey: { _type: string; _value: StrategyKey[] };
        };
        order: { createdAt: string };
      },
    ];

    expect(findOptions.where).toEqual(
      expect.objectContaining({
        watchlistId: 'watch-id',
        enabled: true,
      }),
    );
    expect(findOptions.where.strategyKey).toEqual(
      expect.objectContaining({
        _type: 'in',
        _value: [StrategyKey.SMC, StrategyKey.ICT],
      }),
    );
    expect(findOptions.order).toEqual({ createdAt: 'DESC' });
  });

  it('updates an existing strategy config during upsert', async () => {
    const repository = createRepository();
    const existing = {
      id: 'config-id',
      watchlistId: 'watch-id',
      strategyKey: StrategyKey.SMC,
      enabled: false,
      paramsJson: {},
    } as StrategyConfigEntity;
    repository.findOne?.mockResolvedValue(existing);
    const service = createService(repository);

    await service.upsertStrategyConfig({
      watchlistId: 'watch-id',
      strategyKey: StrategyKey.SMC,
      enabled: true,
      paramsJson: { swingLookback: 5 },
    });

    expect(repository.save).toHaveBeenCalledWith({
      ...existing,
      enabled: true,
      paramsJson: { swingLookback: 5 },
    });
  });

  it('creates a strategy config when missing during upsert', async () => {
    const repository = createRepository();
    repository.findOne?.mockResolvedValue(null);
    const service = createService(repository);

    await service.upsertStrategyConfig({
      watchlistId: 'watch-id',
      strategyKey: StrategyKey.SMC,
      enabled: true,
      paramsJson: {},
    });

    expect(repository.create).toHaveBeenCalledWith({
      watchlistId: 'watch-id',
      strategyKey: StrategyKey.SMC,
      enabled: true,
      paramsJson: {},
    });
  });

  it('maps unique conflicts to ConflictException', async () => {
    const repository = createRepository();
    repository.findOne?.mockResolvedValue(null);
    repository.save?.mockRejectedValue({ code: '23505' });
    const service = createService(repository);

    await expect(
      service.upsertStrategyConfig({
        watchlistId: 'watch-id',
        strategyKey: StrategyKey.SMC,
        enabled: true,
        paramsJson: {},
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns default configs when a watchlist has no saved configs', async () => {
    const repository = createRepository();
    repository.find?.mockResolvedValue([]);
    const watchlistService = createWatchlistService();
    const service = createService(repository, watchlistService);

    const result =
      await service.getConfigsWithDefaultsByWatchlistId('watch-id');

    expect(watchlistService.updateWatchItem).toHaveBeenCalledWith(
      'watch-id',
      {},
    );
    expect(result).toEqual(DEFAULT_STRATEGY_CONFIGS);
  });

  it('merges saved configs over default configs by strategy key', async () => {
    const repository = createRepository();
    repository.find?.mockResolvedValue([
      {
        strategyKey: StrategyKey.ICT,
        enabled: true,
        paramsJson: { killZone: 'london' },
      },
    ]);
    const service = createService(repository);

    const result =
      await service.getConfigsWithDefaultsByWatchlistId('watch-id');

    expect(result).toEqual([
      DEFAULT_STRATEGY_CONFIGS[0],
      {
        strategyKey: StrategyKey.ICT,
        enabled: true,
        paramsJson: { killZone: 'london' },
      },
    ]);
  });

  it('does not return configs for a missing watchlist item', async () => {
    const repository = createRepository();
    const watchlistService = createWatchlistService();
    jest
      .mocked(watchlistService.updateWatchItem)
      .mockRejectedValue(new NotFoundException('Watch item not found'));
    const service = createService(repository, watchlistService);

    await expect(
      service.getConfigsWithDefaultsByWatchlistId('missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.find).not.toHaveBeenCalled();
  });

  it('does not upsert config for a missing watchlist item', async () => {
    const repository = createRepository();
    const watchlistService = createWatchlistService();
    jest
      .mocked(watchlistService.updateWatchItem)
      .mockRejectedValue(new NotFoundException('Watch item not found'));
    const service = createService(repository, watchlistService);

    await expect(
      service.upsertStrategyConfig({
        watchlistId: 'missing',
        strategyKey: StrategyKey.SMC,
        enabled: true,
        paramsJson: {},
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
