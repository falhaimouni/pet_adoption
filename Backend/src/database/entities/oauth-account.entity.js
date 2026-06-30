"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthAccount = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let OAuthAccount = class OAuthAccount {
};
exports.OAuthAccount = OAuthAccount;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'oauth_id' }),
    __metadata("design:type", String)
], OAuthAccount.prototype, "oauthId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid' }),
    __metadata("design:type", String)
], OAuthAccount.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 80 }),
    __metadata("design:type", String)
], OAuthAccount.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'provider_user_id', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], OAuthAccount.prototype, "providerUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.oauthAccounts, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], OAuthAccount.prototype, "user", void 0);
exports.OAuthAccount = OAuthAccount = __decorate([
    (0, typeorm_1.Entity)('oauth_accounts'),
    (0, typeorm_1.Unique)(['provider', 'providerUserId'])
], OAuthAccount);
