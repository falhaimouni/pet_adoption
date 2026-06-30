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
exports.Vaccination = void 0;
const typeorm_1 = require("typeorm");
const pet_entity_1 = require("./pet.entity");
const user_entity_1 = require("./user.entity");
let Vaccination = class Vaccination {
};
exports.Vaccination = Vaccination;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'vaccination_id' }),
    __metadata("design:type", String)
], Vaccination.prototype, "vaccinationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pet_id', type: 'uuid' }),
    __metadata("design:type", String)
], Vaccination.prototype, "petId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vaccine_name', type: 'varchar', length: 160 }),
    __metadata("design:type", String)
], Vaccination.prototype, "vaccineName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vaccination_date', type: 'date' }),
    __metadata("design:type", String)
], Vaccination.prototype, "vaccinationDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'next_due_date', type: 'date', nullable: true }),
    __metadata("design:type", String)
], Vaccination.prototype, "nextDueDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'veterinarian_id', type: 'uuid' }),
    __metadata("design:type", String)
], Vaccination.prototype, "veterinarianId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => pet_entity_1.Pet, (pet) => pet.vaccinations, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'pet_id' }),
    __metadata("design:type", pet_entity_1.Pet)
], Vaccination.prototype, "pet", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.vaccinations, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'veterinarian_id' }),
    __metadata("design:type", user_entity_1.User)
], Vaccination.prototype, "veterinarian", void 0);
exports.Vaccination = Vaccination = __decorate([
    (0, typeorm_1.Entity)('vaccinations')
], Vaccination);
