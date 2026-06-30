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
exports.FileUpload = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let FileUpload = class FileUpload {
};
exports.FileUpload = FileUpload;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'file_id' }),
    __metadata("design:type", String)
], FileUpload.prototype, "fileId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'uploaded_by', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], FileUpload.prototype, "uploadedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_name', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], FileUpload.prototype, "fileName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_url', type: 'text' }),
    __metadata("design:type", String)
], FileUpload.prototype, "fileUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_type', type: 'varchar', length: 120, nullable: true }),
    __metadata("design:type", String)
], FileUpload.prototype, "fileType", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'uploaded_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], FileUpload.prototype, "uploadedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.uploadedFiles, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'uploaded_by' }),
    __metadata("design:type", user_entity_1.User)
], FileUpload.prototype, "uploadedByUser", void 0);
exports.FileUpload = FileUpload = __decorate([
    (0, typeorm_1.Entity)('file_uploads')
], FileUpload);
