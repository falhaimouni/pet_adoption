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
exports.AdoptionRequest = void 0;
const typeorm_1 = require("typeorm");
const adoption_entity_1 = require("./adoption.entity");
const adopter_entity_1 = require("./adopter.entity");
const pet_entity_1 = require("./pet.entity");
const user_entity_1 = require("./user.entity");
let AdoptionRequest = class AdoptionRequest {
};
exports.AdoptionRequest = AdoptionRequest;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'request_id' }),
    __metadata("design:type", String)
], AdoptionRequest.prototype, "requestId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'adopter_id', type: 'uuid' }),
    __metadata("design:type", String)
], AdoptionRequest.prototype, "adopterId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pet_id', type: 'uuid' }),
    __metadata("design:type", String)
], AdoptionRequest.prototype, "petId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 40, default: 'pending' }),
    __metadata("design:type", String)
], AdoptionRequest.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AdoptionRequest.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'request_date', type: 'date' }),
    __metadata("design:type", String)
], AdoptionRequest.prototype, "requestDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reviewed_by', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], AdoptionRequest.prototype, "reviewedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => adopter_entity_1.Adopter, (adopter) => adopter.adoptionRequests, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'adopter_id' }),
    __metadata("design:type", adopter_entity_1.Adopter)
], AdoptionRequest.prototype, "adopter", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => pet_entity_1.Pet, (pet) => pet.adoptionRequests, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'pet_id' }),
    __metadata("design:type", pet_entity_1.Pet)
], AdoptionRequest.prototype, "pet", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.reviewedAdoptionRequests, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'reviewed_by' }),
    __metadata("design:type", user_entity_1.User)
], AdoptionRequest.prototype, "reviewer", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => adoption_entity_1.Adoption, (adoption) => adoption.request),
    __metadata("design:type", adoption_entity_1.Adoption)
], AdoptionRequest.prototype, "adoption", void 0);
exports.AdoptionRequest = AdoptionRequest = __decorate([
    (0, typeorm_1.Entity)('adoption_requests'),
    (0, typeorm_1.Unique)(['adopterId', 'petId'])
], AdoptionRequest);
