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
exports.Adopter = void 0;
const typeorm_1 = require("typeorm");
const adoption_request_entity_1 = require("./adoption-request.entity");
const conversation_entity_1 = require("./conversation.entity");
const user_entity_1 = require("./user.entity");
let Adopter = class Adopter {
};
exports.Adopter = Adopter;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'adopter_id' }),
    __metadata("design:type", String)
], Adopter.prototype, "adopterId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid', unique: true }),
    __metadata("design:type", String)
], Adopter.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Adopter.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Adopter.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'registration_date', type: 'date' }),
    __metadata("design:type", String)
], Adopter.prototype, "registrationDate", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User, (user) => user.adopterProfile, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], Adopter.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => adoption_request_entity_1.AdoptionRequest, (request) => request.adopter),
    __metadata("design:type", Array)
], Adopter.prototype, "adoptionRequests", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => conversation_entity_1.Conversation, (conversation) => conversation.adopter),
    __metadata("design:type", Array)
], Adopter.prototype, "conversations", void 0);
exports.Adopter = Adopter = __decorate([
    (0, typeorm_1.Entity)('adopters')
], Adopter);
