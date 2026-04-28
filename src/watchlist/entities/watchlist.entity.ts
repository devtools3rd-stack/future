import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StrategyConfigEntity } from '../../strategies/entities/strategy-config.entity';

export enum WatchlistTimeframe {
  FIVE_MINUTES = '5m',
  FIFTEEN_MINUTES = '15m',
  ONE_HOUR = '1h',
  FOUR_HOURS = '4h',
}

export enum WatchlistStatus {
  WATCHING = 'WATCHING',
  NO_SIGNAL = 'NO_SIGNAL',
  SIGNAL_SENT = 'SIGNAL_SENT',
  FETCH_ERROR = 'FETCH_ERROR',
  TELEGRAM_ERROR = 'TELEGRAM_ERROR',
}

@Entity('watchlist')
@Index('UQ_watchlist_symbol_timeframe', ['symbol', 'timeframe'], {
  unique: true,
})
export class WatchlistEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 32 })
  symbol!: string;

  @Column({
    type: 'enum',
    enum: WatchlistTimeframe,
    enumName: 'watchlist_timeframe_enum',
  })
  timeframe!: WatchlistTimeframe;

  @Column({
    type: 'enum',
    enum: WatchlistStatus,
    enumName: 'watchlist_status_enum',
  })
  status!: WatchlistStatus;

  @OneToMany(
    () => StrategyConfigEntity,
    (strategyConfig) => strategyConfig.watchlist,
  )
  strategyConfigs!: StrategyConfigEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
