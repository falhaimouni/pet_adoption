import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueLineItemConstraints1780690483242 implements MigrationInterface {
  name = 'AddUniqueLineItemConstraints1780690483242';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const cartItemsTable = await queryRunner.getTable('cart_items');
    if (cartItemsTable && !cartItemsTable.uniques.some((unique) => unique.name === 'UQ_cart_items_cart_id_product_id')) {
      await queryRunner.query(
        `ALTER TABLE "cart_items" ADD CONSTRAINT "UQ_cart_items_cart_id_product_id" UNIQUE ("cart_id", "product_id")`,
      );
    }

    const orderItemsTable = await queryRunner.getTable('order_items');
    if (orderItemsTable && !orderItemsTable.uniques.some((unique) => unique.name === 'UQ_order_items_order_id_product_id')) {
      await queryRunner.query(
        `ALTER TABLE "order_items" ADD CONSTRAINT "UQ_order_items_order_id_product_id" UNIQUE ("order_id", "product_id")`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const orderItemsTable = await queryRunner.getTable('order_items');
    if (orderItemsTable?.uniques.some((unique) => unique.name === 'UQ_order_items_order_id_product_id')) {
      await queryRunner.query(
        `ALTER TABLE "order_items" DROP CONSTRAINT "UQ_order_items_order_id_product_id"`,
      );
    }

    const cartItemsTable = await queryRunner.getTable('cart_items');
    if (cartItemsTable?.uniques.some((unique) => unique.name === 'UQ_cart_items_cart_id_product_id')) {
      await queryRunner.query(
        `ALTER TABLE "cart_items" DROP CONSTRAINT "UQ_cart_items_cart_id_product_id"`,
      );
    }
  }
}
