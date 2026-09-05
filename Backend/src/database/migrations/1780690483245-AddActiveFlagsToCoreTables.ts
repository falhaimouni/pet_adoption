import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActiveFlagsToCoreTables1780690483245 implements MigrationInterface {
  name = 'AddActiveFlagsToCoreTables1780690483245';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "departments" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplies" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "adoptions" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "adoptions" DROP COLUMN IF EXISTS "is_active"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplies" DROP COLUMN IF EXISTS "is_active"`,
    );
    await queryRunner.query(
      `ALTER TABLE "suppliers" DROP COLUMN IF EXISTS "is_active"`,
    );
    await queryRunner.query(
      `ALTER TABLE "departments" DROP COLUMN IF EXISTS "is_active"`,
    );
  }
}