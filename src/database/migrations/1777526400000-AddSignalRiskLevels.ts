import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSignalRiskLevels1777526400000 implements MigrationInterface {
  name = 'AddSignalRiskLevels1777526400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "signals" ADD "stop_loss" numeric(18,8)`,
    );
    await queryRunner.query(
      `ALTER TABLE "signals" ADD "take_profit" numeric(18,8)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "signals" DROP COLUMN "take_profit"`);
    await queryRunner.query(`ALTER TABLE "signals" DROP COLUMN "stop_loss"`);
  }
}
