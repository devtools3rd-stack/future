import { ConflictException } from '@nestjs/common';
import {
  WatchlistEntity,
  WatchlistStatus,
  WatchlistTimeframe,
} from './entities/watchlist.entity';
import { WatchlistController } from './watchlist.controller';
import { WatchlistService } from './watchlist.service';

function createWatchItem(
  overrides: Partial<WatchlistEntity> = {},
): WatchlistEntity {
  return {
    id: 'watch-id',
    symbol: 'BTCUSDT',
    timeframe: WatchlistTimeframe.ONE_HOUR,
    status: WatchlistStatus.WATCHING,
    strategyConfigs: [],
    createdAt: new Date('2026-04-28T10:00:00.000Z'),
    updatedAt: new Date('2026-04-28T10:00:00.000Z'),
    ...overrides,
  };
}

describe('WatchlistController', () => {
  it('returns watchlist data', async () => {
    const getWatchlist = jest.fn().mockResolvedValue([createWatchItem()]);
    const controller = new WatchlistController({
      getWatchlist,
    } as unknown as WatchlistService);

    const response = await controller.getWatchlist();

    expect(getWatchlist).toHaveBeenCalledTimes(1);
    expect(response).toEqual({ data: [createWatchItem()] });
  });

  it('creates a watchlist item with default service behavior', async () => {
    const watchItem = createWatchItem();
    const createWatchItemMock = jest.fn().mockResolvedValue(watchItem);
    const controller = new WatchlistController({
      createWatchItem: createWatchItemMock,
    } as unknown as WatchlistService);

    const response = await controller.createWatchItem({
      symbol: 'BTCUSDT',
      timeframe: WatchlistTimeframe.ONE_HOUR,
    });

    expect(createWatchItemMock).toHaveBeenCalledWith({
      symbol: 'BTCUSDT',
      timeframe: WatchlistTimeframe.ONE_HOUR,
    });
    expect(response).toEqual({ data: watchItem });
  });

  it('bubbles duplicate conflicts from service', async () => {
    const createWatchItemMock = jest
      .fn()
      .mockRejectedValue(new ConflictException('Watch item already exists'));
    const controller = new WatchlistController({
      createWatchItem: createWatchItemMock,
    } as unknown as WatchlistService);

    await expect(
      controller.createWatchItem({
        symbol: 'BTCUSDT',
        timeframe: WatchlistTimeframe.ONE_HOUR,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates allowed watchlist fields', async () => {
    const watchItem = createWatchItem({
      timeframe: WatchlistTimeframe.FIFTEEN_MINUTES,
      status: WatchlistStatus.NO_SIGNAL,
    });
    const updateWatchItem = jest.fn().mockResolvedValue(watchItem);
    const controller = new WatchlistController({
      updateWatchItem,
    } as unknown as WatchlistService);

    const response = await controller.updateWatchItem('watch-id', {
      timeframe: WatchlistTimeframe.FIFTEEN_MINUTES,
      status: WatchlistStatus.NO_SIGNAL,
    });

    expect(updateWatchItem).toHaveBeenCalledWith('watch-id', {
      timeframe: WatchlistTimeframe.FIFTEEN_MINUTES,
      status: WatchlistStatus.NO_SIGNAL,
    });
    expect(response).toEqual({ data: watchItem });
  });

  it('deletes a watchlist item', async () => {
    const deleteWatchItem = jest.fn().mockResolvedValue(undefined);
    const controller = new WatchlistController({
      deleteWatchItem,
    } as unknown as WatchlistService);

    const response = await controller.deleteWatchItem('watch-id');

    expect(deleteWatchItem).toHaveBeenCalledWith('watch-id');
    expect(response).toEqual({ data: { deleted: true } });
  });
});
