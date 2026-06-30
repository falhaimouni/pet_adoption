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
exports.Adoption = void 0;
const typeorm_1 = require("typeorm");
const adoption_request_entity_1 = require("./adoption-request.entity");
let Adoption = class Adoption {
};
exports.Adoption = Adoption;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'adoption_id' }),
    __metadata("design:type", String)
], Adoption.prototype, "adoptionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'request_id', type: 'uuid', unique: true }),
    __metadata("design:type", String)
], Adoption.prototype, "requestId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'adoption_date', type: 'date' }),
    __metadata("design:type", String)
], Adoption.prototype, "adoptionDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'adoption_fee', type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", String)
], Adoption.prototype, "adoptionFee", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contract_status', type: 'varchar', length: 80, default: 'pending' }),
    __metadata("design:type", String)
], Adoption.prototype, "contractStatus", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => adoption_request_entity_1.AdoptionRequest, (request) => request.adoption, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'request_id' }),
    __metadata("design:type", adoption_request_entity_1.AdoptionRequest)
], Adoption.prototype, "request", void 0);
exports.Adoption = Adoption = __decorate([
    (0, typeorm_1.Entity)('adoptions')
], Adoption);
