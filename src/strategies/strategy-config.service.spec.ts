import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { StrategyConfigEntity } from './entities/strategy-config.entity';
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

describe('StrategyConfigService', () => {
  it('gets configs by watchlist id', async () => {
    const repository = createRepository();
    const service = new StrategyConfigService(
      repository as unknown as Repository<StrategyConfigEntity>,
    );

    await service.getConfigsByWatchlistId('watch-id');

    expect(repository.find).toHaveBeenCalledWith({
      where: { watchlistId: 'watch-id' },
      order: { createdAt: 'DESC' },
    });
  });

  it('gets enabled configs by watchlist id', async () => {
    const repository = createRepository();
    const service = new StrategyConfigService(
      repository as unknown as Repository<StrategyConfigEntity>,
    );

    await service.getEnabledStrategiesByWatchlistId('watch-id');

    expect(repository.find).toHaveBeenCalledWith({
      where: { watchlistId: 'watch-id', enabled: true },
      order: { createdAt: 'DESC' },
    });
  });

  it('updates an existing strategy config during upsert', async () => {
    const repository = createRepository();
    const existing = {
      id: 'config-id',
      watchlistId: 'watch-id',
      strategyKey: 'rsi',
      enabled: false,
      paramsJson: {},
    } as StrategyConfigEntity;
    repository.findOne?.mockResolvedValue(existing);
    const service = new StrategyConfigService(
      repository as unknown as Repository<StrategyConfigEntity>,
    );

    await service.upsertStrategyConfig({
      watchlistId: 'watch-id',
      strategyKey: 'rsi',
      enabled: true,
      paramsJson: { period: 14 },
    });

    expect(repository.save).toHaveBeenCalledWith({
      ...existing,
      enabled: true,
      paramsJson: { period: 14 },
    });
  });

  it('creates a strategy config when missing during upsert', async () => {
    const repository = createRepository();
    repository.findOne?.mockResolvedValue(null);
    const service = new StrategyConfigService(
      repository as unknown as Repository<StrategyConfigEntity>,
    );

    await service.upsertStrategyConfig({
      watchlistId: 'watch-id',
      strategyKey: 'rsi',
      enabled: true,
      paramsJson: {},
    });

    expect(repository.create).toHaveBeenCalledWith({
      watchlistId: 'watch-id',
      strategyKey: 'rsi',
      enabled: true,
      paramsJson: {},
    });
  });

  it('maps unique conflicts to ConflictException', async () => {
    const repository = createRepository();
    repository.findOne?.mockResolvedValue(null);
    repository.save?.mockRejectedValue({ code: '23505' });
    const service = new StrategyConfigService(
      repository as unknown as Repository<StrategyConfigEntity>,
    );

    await expect(
      service.upsertStrategyConfig({
        watchlistId: 'watch-id',
        strategyKey: 'rsi',
        enabled: true,
        paramsJson: {},
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
