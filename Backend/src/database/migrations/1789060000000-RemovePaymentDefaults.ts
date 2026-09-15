import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemovePaymentDefaults1789060000000 implements MigrationInterface {
  name = 'RemovePaymentDefaults1789060000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "amount" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "payment_method" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "payment_status" DROP DEFAULT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "amount" SET DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "payment_method" SET DEFAULT 'CASH'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "payment_status" SET DEFAULT 'PAID'`,
    );
  }
}
