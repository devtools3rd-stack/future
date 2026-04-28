import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum SignalDirection {
  LONG = 'LONG',
  SHORT = 'SHORT',
}

@Entity('signals')
@Index('IDX_signals_query_lookup', [
  'symbol',
  'timeframe',
  'strategyKey',
  'createdAt',
])
export class SignalEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 32 })
  symbol!: string;

  @Column({ type: 'varchar', length: 16 })
  timeframe!: string;

  @Column({ name: 'strategy_key', type: 'varchar', length: 64 })
  strategyKey!: string;

  @Column({
    type: 'enum',
    enum: SignalDirection,
    enumName: 'signal_direction_enum',
  })
  direction!: SignalDirection;

  @Column({ type: 'numeric', precision: 18, scale: 8 })
  price!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ name: 'meta_json', type: 'jsonb', nullable: true })
  metaJson!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
