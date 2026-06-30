"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAuthProviderAndResetTokenHash1780690483240 = void 0;
class AddAuthProviderAndResetTokenHash1780690483240 {
    constructor() {
        this.name = 'AddAuthProviderAndResetTokenHash1780690483240';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."users_provider_enum" AS ENUM('LOCAL', 'GOOGLE')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "provider" "public"."users_provider_enum" NOT NULL DEFAULT 'LOCAL'`);
        await queryRunner.query(`ALTER TABLE "password_reset_tokens" RENAME COLUMN "token" TO "token_hash"`);
        await queryRunner.query(`ALTER TABLE "password_reset_tokens" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "password_reset_tokens" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "password_reset_tokens" RENAME COLUMN "token_hash" TO "token"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "provider"`);
        await queryRunner.query(`DROP TYPE "public"."users_provider_enum"`);
    }
}
exports.AddAuthProviderAndResetTokenHash1780690483240 = AddAuthProviderAndResetTokenHash1780690483240;
