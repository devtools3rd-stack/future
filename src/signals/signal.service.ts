import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { mapRepositoryError } from '../database/repository-error';
import { SignalDirection, SignalEntity } from './entities/signal.entity';

export type SaveSignalInput = Pick<
  SignalEntity,
  | 'symbol'
  | 'timeframe'
  | 'strategyKey'
  | 'direction'
  | 'price'
  | 'stopLoss'
  | 'takeProfit'
  | 'message'
  | 'metaJson'
>;

export type GetRecentSignalsInput = Partial<
  Pick<SignalEntity, 'symbol' | 'timeframe' | 'strategyKey'>
> & {
  direction?: SignalDirection;
  limit?: number;
};

@Injectable()
export class SignalService {
  constructor(
    @InjectRepository(SignalEntity)
    private readonly signalRepository: Repository<SignalEntity>,
  ) {}

  async saveSignal(input: SaveSignalInput): Promise<SignalEntity> {
    try {
      const signal = this.signalRepository.create(input);

      return await this.signalRepository.save(signal);
    } catch (error) {
      mapRepositoryError(error, 'Signal already exists');
    }
  }

  getRecentSignals(input: GetRecentSignalsInput = {}): Promise<SignalEntity[]> {
    return this.signalRepository.find({
      where: this.buildRecentSignalsWhere(input),
      order: { createdAt: 'DESC' },
      take: input.limit ?? 50,
    });
  }

  getLastSignalBySymbolTimeframeStrategy(
    symbol: string,
    timeframe: string,
    strategyKey: string,
  ): Promise<SignalEntity | null> {
    return this.signalRepository.findOne({
      where: {
        symbol,
        timeframe,
        strategyKey,
      },
      order: { createdAt: 'DESC' },
    });
  }

  private buildRecentSignalsWhere(
    input: GetRecentSignalsInput,
  ): FindOptionsWhere<SignalEntity> {
    const where: FindOptionsWhere<SignalEntity> = {};

    if (input.symbol) {
      where.symbol = input.symbol;
    }

    if (input.timeframe) {
      where.timeframe = input.timeframe;
    }

    if (input.strategyKey) {
      where.strategyKey = input.strategyKey;
    }

    if (input.direction) {
      where.direction = input.direction;
    }

    return where;
  }
}
