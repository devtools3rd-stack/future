import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { mapRepositoryError } from '../database/repository-error';
import { WatchlistEntity, WatchlistStatus } from './entities/watchlist.entity';

export type CreateWatchItemInput = Pick<
  WatchlistEntity,
  'symbol' | 'timeframe'
> &
  Partial<Pick<WatchlistEntity, 'status'>>;

export type UpdateWatchItemInput = Partial<
  Pick<WatchlistEntity, 'symbol' | 'timeframe' | 'status'>
>;

@Injectable()
export class WatchlistService {
  constructor(
    @InjectRepository(WatchlistEntity)
    private readonly watchlistRepository: Repository<WatchlistEntity>,
  ) {}

  async createWatchItem(input: CreateWatchItemInput): Promise<WatchlistEntity> {
    try {
      const watchItem = this.watchlistRepository.create({
        ...input,
        status: input.status ?? WatchlistStatus.WATCHING,
      });

      return await this.watchlistRepository.save(watchItem);
    } catch (error) {
      mapRepositoryError(error, 'Watch item already exists');
    }
  }

  getWatchlist(): Promise<WatchlistEntity[]> {
    return this.watchlistRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async updateWatchItem(
    id: string,
    input: UpdateWatchItemInput,
  ): Promise<WatchlistEntity> {
    const watchItem = await this.findWatchItemOrThrow(id);

    try {
      return await this.watchlistRepository.save({
        ...watchItem,
        ...input,
      });
    } catch (error) {
      mapRepositoryError(error, 'Watch item already exists');
    }
  }

  async deleteWatchItem(id: string): Promise<void> {
    const result = await this.watchlistRepository.delete({ id });

    if (!result.affected) {
      throw new NotFoundException('Watch item not found');
    }
  }

  updateStatus(id: string, status: WatchlistStatus): Promise<WatchlistEntity> {
    return this.updateWatchItem(id, { status });
  }

  private async findWatchItemOrThrow(id: string): Promise<WatchlistEntity> {
    const watchItem = await this.watchlistRepository.findOne({
      where: { id },
    });

    if (!watchItem) {
      throw new NotFoundException('Watch item not found');
    }

    return watchItem;
  }
}
