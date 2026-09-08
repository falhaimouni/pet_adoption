import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveDeliveryStatusAndCashPayment1789000000002
  implements MigrationInterface
{
  name = 'RemoveDeliveryStatusAndCashPayment1789000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN "delivery_status"`,
    );
    await queryRunner.query(
      `UPDATE "payments" SET "payment_method" = 'CARD' WHERE "payment_method" = 'CASH'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."payments_payment_method_enum" RENAME TO "payments_payment_method_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_payment_method_enum" AS ENUM('CARD')`,
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
      `DROP TYPE "public"."orders_delivery_status_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."orders_delivery_status_enum" AS ENUM('PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "delivery_status" "public"."orders_delivery_status_enum" NOT NULL DEFAULT 'PENDING'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."payments_payment_method_enum" RENAME TO "payments_payment_method_enum_new"`,
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
      `DROP TYPE "public"."payments_payment_method_enum_new"`,
    );
  }
}