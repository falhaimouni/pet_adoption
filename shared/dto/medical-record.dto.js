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
exports.UpdateMedicalEntryDto = exports.CreateMedicalEntryDto = void 0;
const class_validator_1 = require("class-validator");
const medical_status_constants_1 = require("../constants/medical-status.constants");
class CreateMedicalEntryDto {
}
exports.CreateMedicalEntryDto = CreateMedicalEntryDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], CreateMedicalEntryDto.prototype, "diagnosis", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], CreateMedicalEntryDto.prototype, "treatment", void 0);
__decorate([
    (0, class_validator_1.IsIn)(Object.values(medical_status_constants_1.MEDICAL_STATUS)),
    __metadata("design:type", String)
], CreateMedicalEntryDto.prototype, "vaccinationStatus", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateMedicalEntryDto.prototype, "medicalDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], CreateMedicalEntryDto.prototype, "notes", void 0);
class UpdateMedicalEntryDto {
}
exports.UpdateMedicalEntryDto = UpdateMedicalEntryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], UpdateMedicalEntryDto.prototype, "diagnosis", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], UpdateMedicalEntryDto.prototype, "treatment", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(Object.values(medical_status_constants_1.MEDICAL_STATUS)),
    __metadata("design:type", String)
], UpdateMedicalEntryDto.prototype, "vaccinationStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], UpdateMedicalEntryDto.prototype, "notes", void 0);
