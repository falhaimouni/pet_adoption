import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterUsersPasswordNullable1780690483251 implements MigrationInterface {
  name = 'AlterUsersPasswordNullable1780690483251';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL`,
    );
  }
}
