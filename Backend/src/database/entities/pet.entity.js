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
exports.Pet = void 0;
const typeorm_1 = require("typeorm");
const adoption_request_entity_1 = require("./adoption-request.entity");
const medical_record_entity_1 = require("./medical-record.entity");
const pet_image_entity_1 = require("./pet-image.entity");
const user_entity_1 = require("./user.entity");
const vaccination_entity_1 = require("./vaccination.entity");
let Pet = class Pet {
};
exports.Pet = Pet;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'pet_id' }),
    __metadata("design:type", String)
], Pet.prototype, "petId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'pet_name', type: 'varchar', length: 120 }),
    __metadata("design:type", String)
], Pet.prototype, "petName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 80 }),
    __metadata("design:type", String)
], Pet.prototype, "species", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 120, nullable: true }),
    __metadata("design:type", String)
], Pet.prototype, "breed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], Pet.prototype, "age", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 30, nullable: true }),
    __metadata("design:type", String)
], Pet.prototype, "gender", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 80, nullable: true }),
    __metadata("design:type", String)
], Pet.prototype, "color", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 8, scale: 2, nullable: true }),
    __metadata("design:type", String)
], Pet.prototype, "weight", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Pet.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'health_status', type: 'varchar', length: 80, nullable: true }),
    __metadata("design:type", String)
], Pet.prototype, "healthStatus", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'adoption_status', type: 'varchar', length: 80, default: 'available' }),
    __metadata("design:type", String)
], Pet.prototype, "adoptionStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'arrival_date', type: 'date', nullable: true }),
    __metadata("design:type", String)
], Pet.prototype, "arrivalDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Pet.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], Pet.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.createdPets, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], Pet.prototype, "createdByUser", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => pet_image_entity_1.PetImage, (image) => image.pet),
    __metadata("design:type", Array)
], Pet.prototype, "images", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => medical_record_entity_1.MedicalRecord, (record) => record.pet),
    __metadata("design:type", medical_record_entity_1.MedicalRecord)
], Pet.prototype, "medicalRecord", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => vaccination_entity_1.Vaccination, (vaccination) => vaccination.pet),
    __metadata("design:type", Array)
], Pet.prototype, "vaccinations", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => adoption_request_entity_1.AdoptionRequest, (request) => request.pet),
    __metadata("design:type", Array)
], Pet.prototype, "adoptionRequests", void 0);
exports.Pet = Pet = __decorate([
    (0, typeorm_1.Entity)('pets')
], Pet);
