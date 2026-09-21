import { MigrationInterface, QueryRunner } from 'typeorm';

export class CashOnlyCheckout1789050000000 implements MigrationInterface {
  name = 'CashOnlyCheckout1789050000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM "orders"
          WHERE "order_status"::text = 'PROCESSING'
        ) THEN
          RAISE EXCEPTION 'Cannot migrate PROCESSING orders automatically; resolve them explicitly before applying CashOnlyCheckout';
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN IF EXISTS "transaction_id"`,
    );

    await queryRunner.query(
      `ALTER TYPE "public"."payments_payment_method_enum" RENAME TO "payments_payment_method_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_payment_method_enum" AS ENUM('CASH')`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "payment_method" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "payment_method" TYPE "public"."payments_payment_method_enum" USING 'CASH'::"public"."payments_payment_method_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "payment_method" SET DEFAULT 'CASH'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."payments_payment_method_enum_old"`,
    );

    await queryRunner.query(
      `ALTER TYPE "public"."payments_payment_status_enum" RENAME TO "payments_payment_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_payment_status_enum" AS ENUM('PAID')`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "payment_status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "payment_status" TYPE "public"."payments_payment_status_enum" USING 'PAID'::"public"."payments_payment_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "payment_status" SET DEFAULT 'PAID'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."payments_payment_status_enum_old"`,
    );

    await queryRunner.query(
      `ALTER TYPE "public"."orders_order_status_enum" RENAME TO "orders_order_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."orders_order_status_enum" AS ENUM('PENDING', 'COMPLETED', 'CANCELED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "order_status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "order_status" TYPE "public"."orders_order_status_enum" USING "order_status"::text::"public"."orders_order_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "order_status" SET DEFAULT 'PENDING'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."orders_order_status_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN IF EXISTS "transaction_id"`,
    );

    await queryRunner.query(
      `ALTER TYPE "public"."payments_payment_method_enum" RENAME TO "payments_payment_method_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_payment_method_enum" AS ENUM('CARD', 'CASH')`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "payment_method" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "payment_method" TYPE "public"."payments_payment_method_enum" USING "payment_method"::text::"public"."payments_payment_method_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "payment_method" SET DEFAULT 'CARD'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."payments_payment_method_enum_old"`,
    );

    await queryRunner.query(
      `ALTER TYPE "public"."payments_payment_status_enum" RENAME TO "payments_payment_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_payment_status_enum" AS ENUM('PENDING', 'PAID', 'FAILED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "payment_status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "payment_status" TYPE "public"."payments_payment_status_enum" USING "payment_status"::text::"public"."payments_payment_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "payment_status" SET DEFAULT 'PENDING'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."payments_payment_status_enum_old"`,
    );

    await queryRunner.query(
      `ALTER TYPE "public"."orders_order_status_enum" RENAME TO "orders_order_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."orders_order_status_enum" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "order_status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "order_status" TYPE "public"."orders_order_status_enum" USING "order_status"::text::"public"."orders_order_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "order_status" SET DEFAULT 'PENDING'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."orders_order_status_enum_old"`,
    );
  }
}
