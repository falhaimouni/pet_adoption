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
exports.User = void 0;
const typeorm_1 = require("typeorm");
const activity_log_entity_1 = require("./activity-log.entity");
const adoption_request_entity_1 = require("./adoption-request.entity");
const adopter_entity_1 = require("./adopter.entity");
const conversation_entity_1 = require("./conversation.entity");
const department_entity_1 = require("./department.entity");
const employee_entity_1 = require("./employee.entity");
const file_upload_entity_1 = require("./file-upload.entity");
const medical_entry_entity_1 = require("./medical-entry.entity");
const message_entity_1 = require("./message.entity");
const notification_entity_1 = require("./notification.entity");
const oauth_account_entity_1 = require("./oauth-account.entity");
const password_reset_token_entity_1 = require("./password-reset-token.entity");
const pet_entity_1 = require("./pet.entity");
const role_entity_1 = require("./role.entity");
const vaccination_entity_1 = require("./vaccination.entity");
let User = class User {
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'user_id' }),
    __metadata("design:type", String)
], User.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'first_name', type: 'varchar', length: 80 }),
    __metadata("design:type", String)
], User.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_name', type: 'varchar', length: 80 }),
    __metadata("design:type", String)
], User.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "avatar", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['LOCAL', 'GOOGLE'],
        default: 'LOCAL',
    }),
    __metadata("design:type", String)
], User.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'role_id', type: 'uuid' }),
    __metadata("design:type", String)
], User.prototype, "roleId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 30, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 40, default: 'active' }),
    __metadata("design:type", String)
], User.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'refresh_token_version', type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "refreshTokenVersion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'oauth_provider', type: 'varchar', length: 80, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "oauthProvider", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => role_entity_1.Role, (role) => role.users, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'role_id' }),
    __metadata("design:type", role_entity_1.Role)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => department_entity_1.Department, (department) => department.manager),
    __metadata("design:type", Array)
], User.prototype, "managedDepartments", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => employee_entity_1.Employee, (employee) => employee.user),
    __metadata("design:type", employee_entity_1.Employee)
], User.prototype, "employeeProfile", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => pet_entity_1.Pet, (pet) => pet.createdByUser),
    __metadata("design:type", Array)
], User.prototype, "createdPets", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => medical_entry_entity_1.MedicalEntry, (entry) => entry.veterinarian),
    __metadata("design:type", Array)
], User.prototype, "medicalEntries", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => vaccination_entity_1.Vaccination, (vaccination) => vaccination.veterinarian),
    __metadata("design:type", Array)
], User.prototype, "vaccinations", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => adopter_entity_1.Adopter, (adopter) => adopter.user),
    __metadata("design:type", adopter_entity_1.Adopter)
], User.prototype, "adopterProfile", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => adoption_request_entity_1.AdoptionRequest, (request) => request.reviewer),
    __metadata("design:type", Array)
], User.prototype, "reviewedAdoptionRequests", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => conversation_entity_1.Conversation, (conversation) => conversation.assignedEmployee),
    __metadata("design:type", Array)
], User.prototype, "assignedConversations", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => message_entity_1.Message, (message) => message.sender),
    __metadata("design:type", Array)
], User.prototype, "sentMessages", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => notification_entity_1.Notification, (notification) => notification.user),
    __metadata("design:type", Array)
], User.prototype, "notifications", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => activity_log_entity_1.ActivityLog, (log) => log.user),
    __metadata("design:type", Array)
], User.prototype, "activityLogs", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => password_reset_token_entity_1.PasswordResetToken, (token) => token.user),
    __metadata("design:type", Array)
], User.prototype, "passwordResetTokens", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => oauth_account_entity_1.OAuthAccount, (account) => account.user),
    __metadata("design:type", Array)
], User.prototype, "oauthAccounts", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => file_upload_entity_1.FileUpload, (file) => file.uploadedByUser),
    __metadata("design:type", Array)
], User.prototype, "uploadedFiles", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);
