import { MigrationInterface, QueryRunner } from 'typeorm';

export class UniquePaymentPerOrder1789070000000 implements MigrationInterface {
  name = 'UniquePaymentPerOrder1789070000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM "payments"
          GROUP BY "order_id"
          HAVING COUNT(*) > 1
        ) THEN
          RAISE EXCEPTION 'Cannot add one-payment-per-order constraint while duplicate payments exist';
        END IF;
      END $$;
    `);

    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "UQ_payments_order_id" UNIQUE ("order_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "UQ_payments_order_id"`,
    );
  }
}