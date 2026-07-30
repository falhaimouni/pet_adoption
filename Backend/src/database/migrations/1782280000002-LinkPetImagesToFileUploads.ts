import { MigrationInterface, QueryRunner } from 'typeorm';

export class LinkPetImagesToFileUploads1782280000002
  implements MigrationInterface
{
  name = 'LinkPetImagesToFileUploads1782280000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pet_images" ADD "file_id" uuid`);
    await queryRunner.query(
      `UPDATE "pet_images" SET "file_id" = uuid_generate_v4()`,
    );

    // Preserve existing URLs by representing each legacy image as a FileUpload.
    await queryRunner.query(`
      INSERT INTO "file_uploads" (
        "file_id",
        "uploaded_by",
        "file_name",
        "file_size",
        "category",
        "file_url",
        "mime_type",
        "uploaded_at"
      )
      SELECT
        "file_id",
        NULL,
        regexp_replace("image_url", '^.*/', ''),
        0,
        'PET_IMAGE',
        "image_url",
        NULL,
        "uploaded_at"
      FROM "pet_images"
    `);

    await queryRunner.query(
      `ALTER TABLE "pet_images" ALTER COLUMN "file_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "pet_images" DROP COLUMN "image_url"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_pet_images_file_id" ON "pet_images" ("file_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "pet_images" ADD CONSTRAINT "FK_pet_images_file_upload" FOREIGN KEY ("file_id") REFERENCES "file_uploads"("file_id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pet_images" ADD "image_url" text`);
    await queryRunner.query(`
      UPDATE "pet_images" AS image
      SET "image_url" = file."file_url"
      FROM "file_uploads" AS file
      WHERE file."file_id" = image."file_id"
    `);
    await queryRunner.query(
      `ALTER TABLE "pet_images" ALTER COLUMN "image_url" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "pet_images" DROP CONSTRAINT "FK_pet_images_file_upload"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_pet_images_file_id"`);
    await queryRunner.query(`ALTER TABLE "pet_images" DROP COLUMN "file_id"`);
  }
}
