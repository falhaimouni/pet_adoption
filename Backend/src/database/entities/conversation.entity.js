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
exports.Conversation = void 0;
const typeorm_1 = require("typeorm");
const adopter_entity_1 = require("./adopter.entity");
const message_entity_1 = require("./message.entity");
const user_entity_1 = require("./user.entity");
let Conversation = class Conversation {
};
exports.Conversation = Conversation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'conversation_id' }),
    __metadata("design:type", String)
], Conversation.prototype, "conversationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'adopter_id', type: 'uuid' }),
    __metadata("design:type", String)
], Conversation.prototype, "adopterId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assigned_employee_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Conversation.prototype, "assignedEmployeeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 40, default: 'open' }),
    __metadata("design:type", String)
], Conversation.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], Conversation.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], Conversation.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => adopter_entity_1.Adopter, (adopter) => adopter.conversations, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'adopter_id' }),
    __metadata("design:type", adopter_entity_1.Adopter)
], Conversation.prototype, "adopter", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.assignedConversations, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'assigned_employee_id' }),
    __metadata("design:type", user_entity_1.User)
], Conversation.prototype, "assignedEmployee", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => message_entity_1.Message, (message) => message.conversation),
    __metadata("design:type", Array)
], Conversation.prototype, "messages", void 0);
exports.Conversation = Conversation = __decorate([
    (0, typeorm_1.Entity)('conversations')
], Conversation);
