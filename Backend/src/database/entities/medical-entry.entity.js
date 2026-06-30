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
exports.MedicalEntry = void 0;
const typeorm_1 = require("typeorm");
const medical_record_entity_1 = require("./medical-record.entity");
const user_entity_1 = require("./user.entity");
let MedicalEntry = class MedicalEntry {
};
exports.MedicalEntry = MedicalEntry;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'entry_id' }),
    __metadata("design:type", String)
], MedicalEntry.prototype, "entryId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'record_id', type: 'uuid' }),
    __metadata("design:type", String)
], MedicalEntry.prototype, "recordId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'veterinarian_id', type: 'uuid' }),
    __metadata("design:type", String)
], MedicalEntry.prototype, "veterinarianId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], MedicalEntry.prototype, "diagnosis", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], MedicalEntry.prototype, "treatment", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vaccination_status', type: 'varchar', length: 80 }),
    __metadata("design:type", String)
], MedicalEntry.prototype, "vaccinationStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'medical_date', type: 'date' }),
    __metadata("design:type", String)
], MedicalEntry.prototype, "medicalDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], MedicalEntry.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], MedicalEntry.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => medical_record_entity_1.MedicalRecord, (record) => record.entries, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'record_id' }),
    __metadata("design:type", medical_record_entity_1.MedicalRecord)
], MedicalEntry.prototype, "medicalRecord", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.medicalEntries, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'veterinarian_id' }),
    __metadata("design:type", user_entity_1.User)
], MedicalEntry.prototype, "veterinarian", void 0);
exports.MedicalEntry = MedicalEntry = __decorate([
    (0, typeorm_1.Entity)('medical_entries')
], MedicalEntry);
