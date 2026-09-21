import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1785401056761 implements MigrationInterface {
    name = 'InitSchema1785401056761'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "adoptions" DROP CONSTRAINT "FK_1587a931d204024da729ff39730"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_22133395bd13b970ccd0c34ab22"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_6c87c0b90a0d97607ff2ad25f4b"`);
        await queryRunner.query(`ALTER TABLE "adopters" DROP CONSTRAINT "FK_665437b6a6c44bcd7bba3e7a0f0"`);
        await queryRunner.query(`ALTER TABLE "medical_records" DROP CONSTRAINT "FK_00f48fa86cd43404c7c3f1cf691"`);
        await queryRunner.query(`ALTER TABLE "adoption_requests" DROP CONSTRAINT "FK_c3c6e3068067af06c5523d6cb85"`);
        await queryRunner.query(`ALTER TABLE "adoption_requests" DROP CONSTRAINT "FK_09878c30ecb8917cc9bddf667e3"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_order_id"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_user_id"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_product_id"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_order_id"`);
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_cart_items_product_id"`);
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_cart_items_cart_id"`);
        await queryRunner.query(`ALTER TABLE "carts" DROP CONSTRAINT "FK_carts_user_id"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "FK_2d83c53c3e553a48dadb9722e38"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "UQ_order_items_order_id_product_id"`);
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "UQ_cart_items_cart_id_product_id"`);
        await queryRunner.query(`ALTER TABLE "supplies" DROP COLUMN "unit_price"`);
        await queryRunner.query(`ALTER TABLE "supplies" ADD "selling_price" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "supplies" ADD "purchase_price" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "supplies" ADD "delivery_time_days" integer`);
        await queryRunner.query(`ALTER TABLE "supplies" ADD "minimum_order_quantity" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "supplies" ADD "supplier_id" uuid`);
        await queryRunner.query(`
            INSERT INTO "suppliers" ("supplier_id", "supplier_name", "is_active")
            SELECT uuid_generate_v4(), 'Legacy Supplier', true
            WHERE NOT EXISTS (
                SELECT 1 FROM "suppliers" WHERE "supplier_name" = 'Legacy Supplier'
            )
        `);
        await queryRunner.query(`
            UPDATE "supplies"
            SET "supplier_id" = (
                SELECT "supplier_id" FROM "suppliers"
                WHERE "supplier_name" = 'Legacy Supplier'
            )
            WHERE "supplier_id" IS NULL
        `);
        await queryRunner.query(`ALTER TABLE "supplies" ALTER COLUMN "supplier_id" SET NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."supplies_status_enum" AS ENUM('AVAILABLE', 'EXPIRED', 'DAMAGED', 'DISCONTINUED', 'OUT_OF_STOCK')`);
        await queryRunner.query(`ALTER TABLE "supplies" ADD "status" "public"."supplies_status_enum" NOT NULL DEFAULT 'AVAILABLE'`);
        await queryRunner.query(`ALTER TABLE "suppliers" ADD CONSTRAINT "UQ_d14c0485eed1edb11c54f246e34" UNIQUE ("supplier_name")`);
        await queryRunner.query(`CREATE INDEX "IDX_91185d86d5d7557b19abbb2868" ON "password_reset_tokens" ("token_hash") `);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "UQ_6335813ef19bc35b8d866cc6565" UNIQUE ("order_id", "product_id")`);
        await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "UQ_dba960dbfd8636893d3c7acb18d" UNIQUE ("cart_id", "product_id")`);
        await queryRunner.query(`ALTER TABLE "adoptions" ADD CONSTRAINT "FK_1587a931d204024da729ff39730" FOREIGN KEY ("request_id") REFERENCES "adoption_requests"("request_id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_22133395bd13b970ccd0c34ab22" FOREIGN KEY ("sender_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "FK_6c87c0b90a0d97607ff2ad25f4b" FOREIGN KEY ("adopter_id") REFERENCES "adopters"("adopter_id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "adopters" ADD CONSTRAINT "FK_665437b6a6c44bcd7bba3e7a0f0" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medical_records" ADD CONSTRAINT "FK_00f48fa86cd43404c7c3f1cf691" FOREIGN KEY ("pet_id") REFERENCES "pets"("pet_id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "adoption_requests" ADD CONSTRAINT "FK_09878c30ecb8917cc9bddf667e3" FOREIGN KEY ("adopter_id") REFERENCES "adopters"("adopter_id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "adoption_requests" ADD CONSTRAINT "FK_c3c6e3068067af06c5523d6cb85" FOREIGN KEY ("pet_id") REFERENCES "pets"("pet_id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_b2f7b823a21562eeca20e72b006" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_a922b820eeef29ac1c6800e826a" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_9263386c35b6b242540f9493b00" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_6385a745d9e12a89b859bb25623" FOREIGN KEY ("cart_id") REFERENCES "carts"("cart_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_30e89257a105eab7648a35c7fce" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "carts" ADD CONSTRAINT "FK_2ec1c94a977b940d85a4f498aea" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "FK_2d83c53c3e553a48dadb9722e38" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "supplies" ADD CONSTRAINT "FK_ed74e03343f5e8bbf84ea0002cb" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("supplier_id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "supplies" DROP CONSTRAINT "FK_ed74e03343f5e8bbf84ea0002cb"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "FK_2d83c53c3e553a48dadb9722e38"`);
        await queryRunner.query(`ALTER TABLE "carts" DROP CONSTRAINT "FK_2ec1c94a977b940d85a4f498aea"`);
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_30e89257a105eab7648a35c7fce"`);
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_6385a745d9e12a89b859bb25623"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_9263386c35b6b242540f9493b00"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_145532db85752b29c57d2b7b1f1"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_a922b820eeef29ac1c6800e826a"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_b2f7b823a21562eeca20e72b006"`);
        await queryRunner.query(`ALTER TABLE "adoption_requests" DROP CONSTRAINT "FK_c3c6e3068067af06c5523d6cb85"`);
        await queryRunner.query(`ALTER TABLE "adoption_requests" DROP CONSTRAINT "FK_09878c30ecb8917cc9bddf667e3"`);
        await queryRunner.query(`ALTER TABLE "medical_records" DROP CONSTRAINT "FK_00f48fa86cd43404c7c3f1cf691"`);
        await queryRunner.query(`ALTER TABLE "adopters" DROP CONSTRAINT "FK_665437b6a6c44bcd7bba3e7a0f0"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_6c87c0b90a0d97607ff2ad25f4b"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_22133395bd13b970ccd0c34ab22"`);
        await queryRunner.query(`ALTER TABLE "adoptions" DROP CONSTRAINT "FK_1587a931d204024da729ff39730"`);
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "UQ_dba960dbfd8636893d3c7acb18d"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "UQ_6335813ef19bc35b8d866cc6565"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_91185d86d5d7557b19abbb2868"`);
        await queryRunner.query(`ALTER TABLE "suppliers" DROP CONSTRAINT "UQ_d14c0485eed1edb11c54f246e34"`);
        await queryRunner.query(`ALTER TABLE "supplies" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."supplies_status_enum"`);
        await queryRunner.query(`ALTER TABLE "supplies" DROP COLUMN "supplier_id"`);
        await queryRunner.query(`ALTER TABLE "supplies" DROP COLUMN "minimum_order_quantity"`);
        await queryRunner.query(`ALTER TABLE "supplies" DROP COLUMN "delivery_time_days"`);
        await queryRunner.query(`ALTER TABLE "supplies" DROP COLUMN "purchase_price"`);
        await queryRunner.query(`ALTER TABLE "supplies" DROP COLUMN "selling_price"`);
        await queryRunner.query(`ALTER TABLE "supplies" ADD "unit_price" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "UQ_cart_items_cart_id_product_id" UNIQUE ("cart_id", "product_id")`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "UQ_order_items_order_id_product_id" UNIQUE ("order_id", "product_id")`);
        await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "FK_2d83c53c3e553a48dadb9722e38" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "carts" ADD CONSTRAINT "FK_carts_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_cart_items_cart_id" FOREIGN KEY ("cart_id") REFERENCES "carts"("cart_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_cart_items_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_order_items_order_id" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_order_items_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_payments_order_id" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "adoption_requests" ADD CONSTRAINT "FK_09878c30ecb8917cc9bddf667e3" FOREIGN KEY ("adopter_id") REFERENCES "adopters"("adopter_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "adoption_requests" ADD CONSTRAINT "FK_c3c6e3068067af06c5523d6cb85" FOREIGN KEY ("pet_id") REFERENCES "pets"("pet_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medical_records" ADD CONSTRAINT "FK_00f48fa86cd43404c7c3f1cf691" FOREIGN KEY ("pet_id") REFERENCES "pets"("pet_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "adopters" ADD CONSTRAINT "FK_665437b6a6c44bcd7bba3e7a0f0" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "FK_6c87c0b90a0d97607ff2ad25f4b" FOREIGN KEY ("adopter_id") REFERENCES "adopters"("adopter_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_22133395bd13b970ccd0c34ab22" FOREIGN KEY ("sender_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "adoptions" ADD CONSTRAINT "FK_1587a931d204024da729ff39730" FOREIGN KEY ("request_id") REFERENCES "adoption_requests"("request_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
