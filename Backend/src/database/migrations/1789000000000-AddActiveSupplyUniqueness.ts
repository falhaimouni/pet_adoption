import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActiveSupplyUniqueness1789000000000 implements MigrationInterface {
  name = 'AddActiveSupplyUniqueness1789000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_supplies_active_name_supplier" ON "supplies" ("supply_name", "supplier_id") WHERE "is_active" = true',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "UQ_supplies_active_name_supplier"',
    );
  }
}
