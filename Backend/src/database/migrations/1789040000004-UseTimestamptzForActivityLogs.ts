import { MigrationInterface, QueryRunner } from 'typeorm';

export class UseTimestamptzForActivityLogs1789040000004
  implements MigrationInterface
{
  name = 'UseTimestamptzForActivityLogs1789040000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "activity_logs" ALTER COLUMN "created_at" TYPE TIMESTAMPTZ USING "created_at" AT TIME ZONE \'UTC\'',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "activity_logs" ALTER COLUMN "created_at" TYPE TIMESTAMP USING "created_at" AT TIME ZONE \'UTC\'',
    );
  }
}