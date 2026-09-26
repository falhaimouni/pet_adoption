import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropAdoptionContractStatus1790220000000 implements MigrationInterface {
  name = 'DropAdoptionContractStatus1790220000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "adoptions" DROP COLUMN IF EXISTS "contract_status"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "adoptions" ADD COLUMN IF NOT EXISTS "contract_status" character varying(80) NOT NULL DEFAULT 'pending'`,
    );
  }
}
