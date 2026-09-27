import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPublicOrderReference1790230000000 implements MigrationInterface {
  name = 'AddPublicOrderReference1790230000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE SEQUENCE orders_reference_seq');
    await queryRunner.query(`
      CREATE FUNCTION next_order_reference(reference_date timestamp DEFAULT CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
      RETURNS text LANGUAGE sql VOLATILE AS $$
        SELECT 'PET-' || to_char(reference_date, 'YYYY') || '-' ||
          lpad(number::text, greatest(6, length(number::text)), '0')
        FROM (SELECT nextval('orders_reference_seq') AS number) sequence_value
      $$
    `);
    await queryRunner.query('ALTER TABLE orders ADD COLUMN order_reference varchar(40)');
    // Stable chronological backfill; the same sequence continues for new orders.
    await queryRunner.query(`
      DO $$
      DECLARE existing_order RECORD;
      BEGIN
        FOR existing_order IN SELECT order_id, created_at FROM orders ORDER BY created_at, order_id LOOP
          UPDATE orders SET order_reference = next_order_reference(existing_order.created_at)
          WHERE order_id = existing_order.order_id;
        END LOOP;
      END $$
    `);
    await queryRunner.query(`
      ALTER TABLE orders
        ALTER COLUMN order_reference SET DEFAULT next_order_reference(),
        ALTER COLUMN order_reference SET NOT NULL,
        ADD CONSTRAINT UQ_orders_order_reference UNIQUE (order_reference)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE orders DROP COLUMN order_reference');
    await queryRunner.query('DROP FUNCTION next_order_reference(timestamp)');
    await queryRunner.query('DROP SEQUENCE orders_reference_seq');
  }
}
