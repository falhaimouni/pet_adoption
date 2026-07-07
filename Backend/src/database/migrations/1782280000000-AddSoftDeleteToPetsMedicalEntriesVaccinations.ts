import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSoftDeleteToPetsMedicalEntriesVaccinations1782280000000
  implements MigrationInterface
{
  name = 'AddSoftDeleteToPetsMedicalEntriesVaccinations1782280000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pets" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "medical_entries" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "vaccinations" ADD "deleted_at" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vaccinations" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "medical_entries" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "pets" DROP COLUMN "deleted_at"`);
  }
}
