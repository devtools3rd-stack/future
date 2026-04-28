import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WatchlistEntity } from '../../watchlist/entities/watchlist.entity';

@Entity('strategy_configs')
@Index(
  'UQ_strategy_configs_watchlist_strategy_key',
  ['watchlistId', 'strategyKey'],
  { unique: true },
)
export class StrategyConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'watchlist_id', type: 'uuid' })
  watchlistId!: string;

  @ManyToOne(() => WatchlistEntity, (watchlist) => watchlist.strategyConfigs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'watchlist_id' })
  watchlist!: WatchlistEntity;

  @Column({ name: 'strategy_key', type: 'varchar', length: 64 })
  strategyKey!: string;

  @Column({ type: 'boolean' })
  enabled!: boolean;

  @Column({ name: 'params_json', type: 'jsonb' })
  paramsJson!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
