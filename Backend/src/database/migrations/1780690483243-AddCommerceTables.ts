import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommerceTables1780690483243 implements MigrationInterface {
  name = 'AddCommerceTables1780690483243';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."orders_order_status_enum" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELED')`);
    await queryRunner.query(`CREATE TYPE "public"."orders_delivery_status_enum" AS ENUM('PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED')`);
    await queryRunner.query(`CREATE TYPE "public"."payments_payment_method_enum" AS ENUM('CARD', 'CASH')`);
    await queryRunner.query(`CREATE TYPE "public"."payments_payment_status_enum" AS ENUM('PENDING', 'PAID', 'FAILED')`);

    await queryRunner.query(`CREATE TABLE "products" ("product_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_name" character varying(160) NOT NULL, "unit_price" numeric(10,2) NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_products_product_id" PRIMARY KEY ("product_id"))`);
    await queryRunner.query(`CREATE TABLE "carts" ("cart_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_carts_user_id" UNIQUE ("user_id"), CONSTRAINT "PK_carts_cart_id" PRIMARY KEY ("cart_id"))`);
    await queryRunner.query(`CREATE TABLE "cart_items" ("cart_item_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "cart_id" uuid NOT NULL, "product_id" uuid NOT NULL, "quantity" integer NOT NULL DEFAULT '1', "unit_price" numeric(10,2) NOT NULL DEFAULT '0', "subtotal" numeric(10,2) NOT NULL DEFAULT '0', CONSTRAINT "UQ_cart_items_cart_id_product_id" UNIQUE ("cart_id", "product_id"), CONSTRAINT "PK_cart_items_cart_item_id" PRIMARY KEY ("cart_item_id"))`);
    await queryRunner.query(`CREATE TABLE "orders" ("order_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "recipient_name" character varying(160) NOT NULL, "phone_number" character varying(30) NOT NULL, "address_line" character varying(255) NOT NULL, "city" character varying(120) NOT NULL, "postal_code" character varying(20), "delivery_notes" text, "delivery_status" "public"."orders_delivery_status_enum" NOT NULL DEFAULT 'PENDING', "total_price" numeric(10,2) NOT NULL DEFAULT '0', "order_status" "public"."orders_order_status_enum" NOT NULL DEFAULT 'PENDING', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_orders_order_id" PRIMARY KEY ("order_id"))`);
    await queryRunner.query(`CREATE TABLE "order_items" ("order_item_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" uuid NOT NULL, "product_id" uuid NOT NULL, "quantity" integer NOT NULL DEFAULT '1', "unit_price" numeric(10,2) NOT NULL DEFAULT '0', "subtotal" numeric(10,2) NOT NULL DEFAULT '0', CONSTRAINT "UQ_order_items_order_id_product_id" UNIQUE ("order_id", "product_id"), CONSTRAINT "PK_order_items_order_item_id" PRIMARY KEY ("order_item_id"))`);
    await queryRunner.query(`CREATE TABLE "payments" ("payment_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" uuid NOT NULL, "amount" numeric(10,2) NOT NULL DEFAULT '0', "payment_method" "public"."payments_payment_method_enum" NOT NULL DEFAULT 'CARD', "payment_status" "public"."payments_payment_status_enum" NOT NULL DEFAULT 'PENDING', "transaction_id" character varying(255), "paid_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_payments_payment_id" PRIMARY KEY ("payment_id"))`);

    await queryRunner.query(`ALTER TABLE "carts" ADD CONSTRAINT "FK_carts_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_cart_items_cart_id" FOREIGN KEY ("cart_id") REFERENCES "carts"("cart_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_cart_items_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_order_items_order_id" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_order_items_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_payments_order_id" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_order_id"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_product_id"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_order_id"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_user_id"`);
    await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_cart_items_product_id"`);
    await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_cart_items_cart_id"`);
    await queryRunner.query(`ALTER TABLE "carts" DROP CONSTRAINT "FK_carts_user_id"`);

    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TABLE "order_items"`);
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TABLE "cart_items"`);
    await queryRunner.query(`DROP TABLE "carts"`);
    await queryRunner.query(`DROP TABLE "products"`);

    await queryRunner.query(`DROP TYPE "public"."payments_payment_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."payments_payment_method_enum"`);
    await queryRunner.query(`DROP TYPE "public"."orders_delivery_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."orders_order_status_enum"`);
  }
}