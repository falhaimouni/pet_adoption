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
exports.Department = void 0;
const typeorm_1 = require("typeorm");
const employee_entity_1 = require("./employee.entity");
const user_entity_1 = require("./user.entity");
let Department = class Department {
};
exports.Department = Department;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'department_id' }),
    __metadata("design:type", String)
], Department.prototype, "departmentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'department_name', type: 'varchar', length: 120 }),
    __metadata("design:type", String)
], Department.prototype, "departmentName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'manager_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Department.prototype, "managerId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Department.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.managedDepartments, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'manager_id' }),
    __metadata("design:type", user_entity_1.User)
], Department.prototype, "manager", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => employee_entity_1.Employee, (employee) => employee.department),
    __metadata("design:type", Array)
], Department.prototype, "employees", void 0);
exports.Department = Department = __decorate([
    (0, typeorm_1.Entity)('departments')
], Department);
