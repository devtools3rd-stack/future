import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import {
  WatchlistEntity,
  WatchlistStatus,
  WatchlistTimeframe,
} from './entities/watchlist.entity';
import { WatchlistService } from './watchlist.service';

type MockRepository<T extends object> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

function createRepository(): MockRepository<WatchlistEntity> {
  return {
    create: jest.fn((input: Partial<WatchlistEntity>) => input),
    save: jest.fn((input: Partial<WatchlistEntity>) => Promise.resolve(input)),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };
}

describe('WatchlistService', () => {
  it('creates a watch item', async () => {
    const repository = createRepository();
    const service = new WatchlistService(
      repository as unknown as Repository<WatchlistEntity>,
    );
    const input = {
      symbol: 'BTCUSDT',
      timeframe: WatchlistTimeframe.FIVE_MINUTES,
      status: WatchlistStatus.WATCHING,
    };

    await service.createWatchItem(input);

    expect(repository.create).toHaveBeenCalledWith(input);
    expect(repository.save).toHaveBeenCalledWith(input);
  });

  it('maps unique conflicts to ConflictException', async () => {
    const repository = createRepository();
    repository.save?.mockRejectedValue({ code: '23505' });
    const service = new WatchlistService(
      repository as unknown as Repository<WatchlistEntity>,
    );

    await expect(
      service.createWatchItem({
        symbol: 'BTCUSDT',
        timeframe: WatchlistTimeframe.FIVE_MINUTES,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('gets watchlist ordered by creation date', async () => {
    const repository = createRepository();
    const service = new WatchlistService(
      repository as unknown as Repository<WatchlistEntity>,
    );

    await service.getWatchlist();

    expect(repository.find).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
    });
  });

  it('updates an existing watch item', async () => {
    const repository = createRepository();
    const existing = { id: 'watch-id', symbol: 'BTCUSDT' } as WatchlistEntity;
    repository.findOne?.mockResolvedValue(existing);
    const service = new WatchlistService(
      repository as unknown as Repository<WatchlistEntity>,
    );

    await service.updateWatchItem('watch-id', { symbol: 'ETHUSDT' });

    expect(repository.save).toHaveBeenCalledWith({
      ...existing,
      symbol: 'ETHUSDT',
    });
  });

  it('throws NotFoundException when updating missing item', async () => {
    const repository = createRepository();
    repository.findOne?.mockResolvedValue(null);
    const service = new WatchlistService(
      repository as unknown as Repository<WatchlistEntity>,
    );

    await expect(service.updateWatchItem('missing', {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deletes an existing watch item', async () => {
    const repository = createRepository();
    repository.delete?.mockResolvedValue({ affected: 1 });
    const service = new WatchlistService(
      repository as unknown as Repository<WatchlistEntity>,
    );

    await service.deleteWatchItem('watch-id');

    expect(repository.delete).toHaveBeenCalledWith({ id: 'watch-id' });
  });

  it('updates status through updateWatchItem', async () => {
    const repository = createRepository();
    const existing = { id: 'watch-id', status: WatchlistStatus.WATCHING };
    repository.findOne?.mockResolvedValue(existing);
    const service = new WatchlistService(
      repository as unknown as Repository<WatchlistEntity>,
    );

    await service.updateStatus('watch-id', WatchlistStatus.NO_SIGNAL);

    expect(repository.save).toHaveBeenCalledWith({
      ...existing,
      status: WatchlistStatus.NO_SIGNAL,
    });
  });
});
