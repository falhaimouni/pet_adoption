import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConcurrencyColumns1789110000000 implements MigrationInterface {
  name = 'AddConcurrencyColumns1789110000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "orders" ADD "idempotency_key" character varying(100)',
    );
    await queryRunner.query(
      'ALTER TABLE "order_items" ADD "supply_id" uuid',
    );
    await queryRunner.query(
      'ALTER TABLE "pets" ADD "version" integer NOT NULL DEFAULT 1',
    );
    await queryRunner.query(
      'ALTER TABLE "medical_entries" ADD "version" integer NOT NULL DEFAULT 1',
    );
    await queryRunner.query(
      'ALTER TABLE "orders" ADD CONSTRAINT "UQ_orders_user_idempotency_key" UNIQUE ("user_id", "idempotency_key")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "orders" DROP CONSTRAINT "UQ_orders_user_idempotency_key"',
    );
    await queryRunner.query(
      'ALTER TABLE "medical_entries" DROP COLUMN "version"',
    );
    await queryRunner.query('ALTER TABLE "pets" DROP COLUMN "version"');
    await queryRunner.query(
      'ALTER TABLE "order_items" DROP COLUMN "supply_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "orders" DROP COLUMN "idempotency_key"',
    );
  }
}
