import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropUserOauthProvider1780690483250 implements MigrationInterface {
  name = 'DropUserOauthProvider1780690483250';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "oauth_provider"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "oauth_provider" character varying(80)`,
    );
  }
}
