import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailVerification1790210000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // Existing and administratively created accounts retain access; public signup opts in.
    await queryRunner.query(`ALTER TABLE users
      ADD COLUMN email_verified boolean NOT NULL DEFAULT true,
      ADD COLUMN email_verification_hash varchar(64),
      ADD COLUMN email_verification_expires_at timestamp`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users DROP COLUMN email_verification_expires_at,
      DROP COLUMN email_verification_hash, DROP COLUMN email_verified`);
  }
}
