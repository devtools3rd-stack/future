import { QueryRunner } from 'typeorm';
import { CreateCryptoSignalTables1777351200000 } from './1777351200000-CreateCryptoSignalTables';

function createQueryRunnerMock(): QueryRunner {
  return {
    query: jest.fn(),
  } as unknown as QueryRunner;
}

function queriesOf(queryRunner: QueryRunner): string[] {
  return (queryRunner.query as jest.Mock).mock.calls.map(
    ([query]) => query as string,
  );
}

describe('CreateCryptoSignalTables1777351200000', () => {
  it('creates crypto signal tables and indexes', async () => {
    const migration = new CreateCryptoSignalTables1777351200000();
    const queryRunner = createQueryRunnerMock();

    await migration.up(queryRunner);

    const sql = queriesOf(queryRunner).join('\n');

    expect(sql).toContain('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    expect(sql).toContain('CREATE TYPE "watchlist_timeframe_enum"');
    expect(sql).toContain('CREATE TABLE "watchlist"');
    expect(sql).toContain('CREATE TABLE "strategy_configs"');
    expect(sql).toContain('CREATE TABLE "signals"');
    expect(sql).toContain('CREATE TABLE "settings"');
    expect(sql).toContain(
      'CREATE UNIQUE INDEX "UQ_watchlist_symbol_timeframe"',
    );
    expect(sql).toContain(
      'CREATE UNIQUE INDEX "UQ_strategy_configs_watchlist_strategy_key"',
    );
    expect(sql).toContain('CREATE INDEX "IDX_signals_query_lookup"');
    expect(sql).toContain('CONSTRAINT "FK_strategy_configs_watchlist"');
  });

  it('drops crypto signal tables and enum types in reverse order', async () => {
    const migration = new CreateCryptoSignalTables1777351200000();
    const queryRunner = createQueryRunnerMock();

    await migration.down(queryRunner);

    const sql = queriesOf(queryRunner).join('\n');

    expect(sql).toContain('DROP TABLE "strategy_configs"');
    expect(sql).toContain('DROP TABLE "watchlist"');
    expect(sql).toContain('DROP TYPE "signal_direction_enum"');
    expect(sql).toContain('DROP TYPE "watchlist_status_enum"');
    expect(sql).toContain('DROP TYPE "watchlist_timeframe_enum"');
  });
});
