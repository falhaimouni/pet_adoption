import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActivityAnalyticsIndexes1789040000003
  implements MigrationInterface
{
  name = 'AddActivityAnalyticsIndexes1789040000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_activity_logs_created_at" ON "activity_logs" ("created_at")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_activity_logs_user_created_at" ON "activity_logs" ("user_id", "created_at")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_activity_logs_user_created_at"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_activity_logs_created_at"',
    );
  }
}