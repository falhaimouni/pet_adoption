"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddRefreshTokenVersion1780690483241 = void 0;
class AddRefreshTokenVersion1780690483241 {
    constructor() {
        this.name = 'AddRefreshTokenVersion1780690483241';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" ADD "refresh_token_version" integer NOT NULL DEFAULT 0`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "refresh_token_version"`);
    }
}
exports.AddRefreshTokenVersion1780690483241 = AddRefreshTokenVersion1780690483241;
