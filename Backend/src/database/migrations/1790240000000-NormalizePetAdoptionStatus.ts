import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizePetAdoptionStatus1790240000000 implements MigrationInterface {
  name = 'NormalizePetAdoptionStatus1790240000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE pets
      SET adoption_status = CASE
        WHEN lower(replace(adoption_status, ' ', '_')) = 'available' THEN 'AVAILABLE'
        WHEN lower(replace(adoption_status, ' ', '_')) = 'pending' THEN 'PENDING'
        WHEN lower(replace(adoption_status, ' ', '_')) = 'adopted' THEN 'ADOPTED'
        WHEN lower(replace(adoption_status, ' ', '_')) = 'medical_hold' THEN 'MEDICAL_HOLD'
        ELSE adoption_status
      END
    `);
    await queryRunner.query(`
      ALTER TABLE pets
      ALTER COLUMN adoption_status SET DEFAULT 'AVAILABLE'
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE pets
      ALTER COLUMN adoption_status SET DEFAULT 'available'
    `);
  }
}
