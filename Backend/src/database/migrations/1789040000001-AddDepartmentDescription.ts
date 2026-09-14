import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDepartmentDescription1789040000001
  implements MigrationInterface
{
  name = 'AddDepartmentDescription1789040000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "departments" ADD COLUMN IF NOT EXISTS "description" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "departments" DROP COLUMN IF EXISTS "description"`,
    );
  }
}