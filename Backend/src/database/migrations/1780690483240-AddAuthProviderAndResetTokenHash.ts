import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthProviderAndResetTokenHash1780690483240
  implements MigrationInterface
{
  name = 'AddAuthProviderAndResetTokenHash1780690483240';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_provider_enum" AS ENUM('LOCAL', 'GOOGLE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "provider" "public"."users_provider_enum" NOT NULL DEFAULT 'LOCAL'`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" RENAME COLUMN "token" TO "token_hash"`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" RENAME COLUMN "token_hash" TO "token"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "provider"`);
    await queryRunner.query(`DROP TYPE "public"."users_provider_enum"`);
  }
}
