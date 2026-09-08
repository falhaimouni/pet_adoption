import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStoreListedToSupplies1789040000000 implements MigrationInterface {
  name = 'AddStoreListedToSupplies1789040000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "supplies" ADD COLUMN IF NOT EXISTS "store_listed" boolean NOT NULL DEFAULT true`,
    );

    await queryRunner.query(`
      UPDATE "products" product
      SET "is_active" = (
        supply."is_active" = true
        AND supply."store_listed" = true
        AND supply."status" = 'AVAILABLE'
        AND supply."quantity" > 0
      )
      FROM "supplies" supply
      WHERE product."product_id" = supply."product_id"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "supplies" DROP COLUMN IF EXISTS "store_listed"`,
    );
  }
}
