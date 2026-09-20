import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSupplyImages1789080000000 implements MigrationInterface {
  name = 'AddSupplyImages1789080000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "supplies" ADD COLUMN IF NOT EXISTS "image_file_id" uuid`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_supplies_image_file_id" ON "supplies" ("image_file_id") WHERE "image_file_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplies" ADD CONSTRAINT "FK_supplies_image_file" FOREIGN KEY ("image_file_id") REFERENCES "file_uploads"("file_id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "supplies" DROP CONSTRAINT IF EXISTS "FK_supplies_image_file"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_supplies_image_file_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplies" DROP COLUMN IF EXISTS "image_file_id"`,
    );
  }
}