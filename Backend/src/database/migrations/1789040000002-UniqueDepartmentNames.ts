import { MigrationInterface, QueryRunner } from 'typeorm';

export class UniqueDepartmentNames1789040000002
  implements MigrationInterface
{
  name = 'UniqueDepartmentNames1789040000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_departments_name_case_insensitive" ON "departments" (LOWER(BTRIM("department_name")))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_departments_name_case_insensitive"`,
    );
  }
}