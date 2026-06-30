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
exports.PetImage = void 0;
const typeorm_1 = require("typeorm");
const pet_entity_1 = require("./pet.entity");
let PetImage = class PetImage {
};
exports.PetImage = PetImage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'image_id' }),
    __metadata("design:type", String)
], PetImage.prototype, "imageId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pet_id', type: 'uuid' }),
    __metadata("design:type", String)
], PetImage.prototype, "petId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'image_url', type: 'text' }),
    __metadata("design:type", String)
], PetImage.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'uploaded_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], PetImage.prototype, "uploadedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => pet_entity_1.Pet, (pet) => pet.images, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'pet_id' }),
    __metadata("design:type", pet_entity_1.Pet)
], PetImage.prototype, "pet", void 0);
exports.PetImage = PetImage = __decorate([
    (0, typeorm_1.Entity)('pet_images')
], PetImage);
