import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { mapRepositoryError } from '../database/repository-error';
import { SignalEntity } from './entities/signal.entity';

export type SaveSignalInput = Pick<
  SignalEntity,
  | 'symbol'
  | 'timeframe'
  | 'strategyKey'
  | 'direction'
  | 'price'
  | 'message'
  | 'metaJson'
>;

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

  getRecentSignals(limit = 50): Promise<SignalEntity[]> {
    return this.signalRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
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
}
