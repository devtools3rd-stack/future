import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCryptoSignalTables1777351200000 implements MigrationInterface {
  name = 'CreateCryptoSignalTables1777351200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query(
      `CREATE TYPE "watchlist_timeframe_enum" AS ENUM ('5m', '15m', '1h', '4h')`,
    );
    await queryRunner.query(
      `CREATE TYPE "watchlist_status_enum" AS ENUM ('WATCHING', 'NO_SIGNAL', 'SIGNAL_SENT', 'FETCH_ERROR', 'TELEGRAM_ERROR')`,
    );
    await queryRunner.query(
      `CREATE TYPE "signal_direction_enum" AS ENUM ('LONG', 'SHORT')`,
    );

    await queryRunner.query(`
      CREATE TABLE "watchlist" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "symbol" character varying(32) NOT NULL,
        "timeframe" "watchlist_timeframe_enum" NOT NULL,
        "status" "watchlist_status_enum" NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_watchlist_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_watchlist_symbol_timeframe" ON "watchlist" ("symbol", "timeframe")`,
    );

    await queryRunner.query(`
      CREATE TABLE "strategy_configs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "watchlist_id" uuid NOT NULL,
        "strategy_key" character varying(64) NOT NULL,
        "enabled" boolean NOT NULL,
        "params_json" jsonb NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_strategy_configs_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_strategy_configs_watchlist" FOREIGN KEY ("watchlist_id") REFERENCES "watchlist"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_strategy_configs_watchlist_strategy_key" ON "strategy_configs" ("watchlist_id", "strategy_key")`,
    );

    await queryRunner.query(`
      CREATE TABLE "signals" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "symbol" character varying(32) NOT NULL,
        "timeframe" character varying(16) NOT NULL,
        "strategy_key" character varying(64) NOT NULL,
        "direction" "signal_direction_enum" NOT NULL,
        "price" numeric(18,8) NOT NULL,
        "message" text NOT NULL,
        "meta_json" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_signals_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_signals_query_lookup" ON "signals" ("symbol", "timeframe", "strategy_key", "created_at")`,
    );

    await queryRunner.query(`
      CREATE TABLE "settings" (
        "key" character varying(128) NOT NULL,
        "value" text NOT NULL,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_settings_key" PRIMARY KEY ("key")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "settings"`);
    await queryRunner.query(`DROP INDEX "IDX_signals_query_lookup"`);
    await queryRunner.query(`DROP TABLE "signals"`);
    await queryRunner.query(
      `DROP INDEX "UQ_strategy_configs_watchlist_strategy_key"`,
    );
    await queryRunner.query(`DROP TABLE "strategy_configs"`);
    await queryRunner.query(`DROP INDEX "UQ_watchlist_symbol_timeframe"`);
    await queryRunner.query(`DROP TABLE "watchlist"`);
    await queryRunner.query(`DROP TYPE "signal_direction_enum"`);
    await queryRunner.query(`DROP TYPE "watchlist_status_enum"`);
    await queryRunner.query(`DROP TYPE "watchlist_timeframe_enum"`);
  }
}
