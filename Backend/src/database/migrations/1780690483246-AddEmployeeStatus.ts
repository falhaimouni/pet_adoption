import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmployeeStatus1780690483246 implements MigrationInterface {
  name = 'AddEmployeeStatus1780690483246';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "status" character varying(40) NOT NULL DEFAULT 'active'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employees" DROP COLUMN IF EXISTS "status"`,
    );
  }
}