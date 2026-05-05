import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOneMinuteWatchlistTimeframe1777440000000 implements MigrationInterface {
  name = 'AddOneMinuteWatchlistTimeframe1777440000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "watchlist_timeframe_enum" ADD VALUE IF NOT EXISTS '1m'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "watchlist" SET "timeframe" = '5m' WHERE "timeframe"::text = '1m'`,
    );
    await queryRunner.query(
      `ALTER TYPE "watchlist_timeframe_enum" RENAME TO "watchlist_timeframe_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "watchlist_timeframe_enum" AS ENUM ('5m', '15m', '1h', '4h')`,
    );
    await queryRunner.query(`
      ALTER TABLE "watchlist"
      ALTER COLUMN "timeframe" TYPE "watchlist_timeframe_enum"
      USING "timeframe"::text::"watchlist_timeframe_enum"
    `);
    await queryRunner.query(`DROP TYPE "watchlist_timeframe_enum_old"`);
  }
}
