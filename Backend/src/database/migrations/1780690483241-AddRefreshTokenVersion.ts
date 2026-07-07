import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefreshTokenVersion1780690483241
  implements MigrationInterface
{
  name = 'AddRefreshTokenVersion1780690483241';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "refresh_token_version" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "refresh_token_version"`,
    );
  }
}
