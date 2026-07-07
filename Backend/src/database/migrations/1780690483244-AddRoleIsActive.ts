import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoleIsActive1780690483244 implements MigrationInterface {
  name = 'AddRoleIsActive1780690483244';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "roles" DROP COLUMN IF EXISTS "is_active"`,
    );
  }
}