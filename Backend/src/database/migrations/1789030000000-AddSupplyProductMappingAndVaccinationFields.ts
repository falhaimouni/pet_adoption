import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSupplyProductMappingAndVaccinationFields1789030000000 implements MigrationInterface {
  name = 'AddSupplyProductMappingAndVaccinationFields1789030000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "supplies" ADD COLUMN IF NOT EXISTS "product_id" uuid`);

    await queryRunner.query(`
      DO $$
      DECLARE
        supply_record RECORD;
        mapped_product_id uuid;
      BEGIN
        FOR supply_record IN SELECT * FROM "supplies" WHERE "product_id" IS NULL LOOP
          mapped_product_id := NULL;

          SELECT "product_id"
          INTO mapped_product_id
          FROM "products"
          WHERE "product_name" = supply_record."supply_name"
            AND "unit_price" = supply_record."selling_price"
            AND "is_active" = (
              supply_record."is_active" = true
              AND supply_record."status" = 'AVAILABLE'
              AND supply_record."quantity" > 0
            )
          LIMIT 1;

          IF mapped_product_id IS NULL THEN
            INSERT INTO "products" ("product_name", "unit_price", "is_active")
            VALUES (
              supply_record."supply_name",
              supply_record."selling_price",
              supply_record."is_active" = true
                AND supply_record."status" = 'AVAILABLE'
                AND supply_record."quantity" > 0
            )
            RETURNING "product_id" INTO mapped_product_id;
          END IF;

          UPDATE "supplies"
          SET "product_id" = mapped_product_id
          WHERE "supply_id" = supply_record."supply_id";
        END LOOP;
      END $$;
    `);

    await queryRunner.query(`ALTER TABLE "supplies" ALTER COLUMN "product_id" SET NOT NULL`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_supplies_product_id" ON "supplies" ("product_id")`);
    await queryRunner.query(`
      ALTER TABLE "supplies"
      ADD CONSTRAINT "FK_supplies_product_id"
      FOREIGN KEY ("product_id") REFERENCES "products"("product_id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`CREATE TYPE "public"."vaccinations_status_enum" AS ENUM('VACCINATED', 'PENDING', 'OVERDUE')`);
    await queryRunner.query(`ALTER TABLE "vaccinations" ADD COLUMN "batch" character varying(120)`);
    await queryRunner.query(`ALTER TABLE "vaccinations" ADD COLUMN "status" "public"."vaccinations_status_enum" NOT NULL DEFAULT 'VACCINATED'`);
    await queryRunner.query(`ALTER TABLE "vaccinations" ADD COLUMN "notes" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vaccinations" DROP COLUMN "notes"`);
    await queryRunner.query(`ALTER TABLE "vaccinations" DROP COLUMN "status"`);
    await queryRunner.query(`ALTER TABLE "vaccinations" DROP COLUMN "batch"`);
    await queryRunner.query(`DROP TYPE "public"."vaccinations_status_enum"`);

    await queryRunner.query(`ALTER TABLE "supplies" DROP CONSTRAINT "FK_supplies_product_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_supplies_product_id"`);
    await queryRunner.query(`ALTER TABLE "supplies" DROP COLUMN "product_id"`);
  }
}
