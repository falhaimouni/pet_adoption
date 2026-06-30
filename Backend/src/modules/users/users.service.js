"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const department_entity_1 = require("../../database/entities/department.entity");
const employee_entity_1 = require("../../database/entities/employee.entity");
const role_entity_1 = require("../../database/entities/role.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const USER_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
};
const ROLE_RANK = {
    ADMIN: 4,
    MANAGER: 3,
    EMPLOYEE: 2,
    VET: 2,
    ADOPTER: 1,
};
const EMPLOYEE_PROFILE_FIELDS = [
    'departmentId',
    'salary',
    'hireDate',
    'address',
];
const BASIC_PROFILE_FIELDS = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'avatar',
];
const MANAGER_UPDATE_FIELDS = [
    ...BASIC_PROFILE_FIELDS,
    ...EMPLOYEE_PROFILE_FIELDS,
    'status',
];
const ADMIN_SELF_UPDATE_FIELDS = [
    ...BASIC_PROFILE_FIELDS,
    'roleId',
    'status',
];
let UsersService = class UsersService {
    constructor(userRepo, roleRepo, departmentRepo, dataSource) {
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
        this.departmentRepo = departmentRepo;
        this.dataSource = dataSource;
    }
    async findAll(currentUser, statusFilter = USER_STATUS.ACTIVE) {
        const normalizedStatusFilter = this.toUserListStatusFilter(statusFilter);
        const currentRole = this.toRoleName(currentUser.role);
        const users = await this.userRepo.find({
            where: normalizedStatusFilter === 'all'
                ? {}
                : { status: normalizedStatusFilter },
            relations: ['role', 'employeeProfile', 'employeeProfile.department'],
            select: {
                userId: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
                phone: true,
                status: true,
                createdAt: true,
                role: {
                    roleId: true,
                    roleName: true,
                },
                employeeProfile: {
                    employeeId: true,
                    departmentId: true,
                    salary: true,
                    hireDate: true,
                    address: true,
                    department: {
                        departmentId: true,
                        departmentName: true,
                    },
                },
            },
        });
        if (currentRole === 'ADMIN') {
            return users;
        }
        return users.filter((user) => this.isLowerRole(currentRole, user.role.roleName));
    }
    async findOne(id, currentUser) {
        const user = await this.userRepo.findOne({
            where: { userId: id },
            relations: ['role', 'employeeProfile', 'employeeProfile.department'],
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (currentUser &&
            currentUser.userId !== id &&
            currentUser.role !== 'ADMIN' &&
            !this.isLowerRole(currentUser.role, user.role.roleName)) {
            throw new common_1.ForbiddenException('You can only access lower-role users');
        }
        const { password: _, ...result } = user;
        return result;
    }
    async findProfile(id) {
        return this.findOne(id);
    }
    async createEmployeeUser(dto) {
        if (dto.status !== undefined) {
            this.ensureValidUserStatus(dto.status);
        }
        const existingUser = await this.userRepo.findOne({
            where: { email: dto.email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email already exists');
        }
        const role = await this.roleRepo.findOne({
            where: { roleId: dto.roleId },
        });
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
        }
        const roleName = this.toRoleName(role.roleName);
        if (roleName === 'ADOPTER' || roleName === 'ADMIN') {
            throw new common_1.BadRequestException('Admin can only create manager, employee, or vet users with employee profiles');
        }
        const department = await this.departmentRepo.findOne({
            where: { departmentId: dto.departmentId },
        });
        if (!department) {
            throw new common_1.NotFoundException('Department not found');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const savedUser = await this.dataSource.transaction(async (manager) => {
            const user = manager.create(user_entity_1.User, {
                firstName: dto.firstName,
                lastName: dto.lastName,
                email: dto.email,
                password: hashedPassword,
                phone: dto.phone,
                role,
                status: dto.status ?? USER_STATUS.ACTIVE,
            });
            const createdUser = await manager.save(user);
            const employee = manager.create(employee_entity_1.Employee, {
                user: createdUser,
                department,
                salary: dto.salary === undefined
                    ? undefined
                    : dto.salary.toFixed(2),
                hireDate: dto.hireDate,
                address: dto.address,
            });
            await manager.save(employee);
            return createdUser;
        });
        return this.findOne(savedUser.userId);
    }
    async updateProfile(id, data) {
        const updateData = {};
        if (data.firstName !== undefined)
            updateData.firstName = data.firstName;
        if (data.lastName !== undefined)
            updateData.lastName = data.lastName;
        if (data.email !== undefined)
            updateData.email = data.email;
        if (data.phone !== undefined)
            updateData.phone = data.phone;
        if (data.avatar !== undefined)
            updateData.avatar = data.avatar;
        if (updateData.email) {
            await this.ensureEmailAvailable(updateData.email, id);
        }
        if (Object.keys(updateData).length > 0) {
            await this.userRepo.update(id, updateData);
        }
        return this.findProfile(id);
    }
    async updateUser(id, data, currentUser) {
        const targetUser = await this.getUserForAuthorization(id);
        const currentRole = this.toRoleName(currentUser.role);
        const targetRole = this.toRoleName(targetUser.role.roleName);
        const isSelf = currentUser.userId === id;
        await this.authorizeUpdate(currentRole, targetRole, isSelf, data);
        if (data.status !== undefined) {
            this.ensureValidUserStatus(data.status);
        }
        let nextRole = targetUser.role;
        if (data.roleId) {
            const requestedRole = await this.roleRepo.findOne({
                where: { roleId: data.roleId },
            });
            if (!requestedRole) {
                throw new common_1.NotFoundException('Role not found');
            }
            nextRole = requestedRole;
            if (isSelf &&
                targetRole === 'ADMIN' &&
                nextRole.roleName !== 'ADMIN') {
                await this.ensureNotLastActiveAdmin();
            }
        }
        if (isSelf &&
            currentRole === 'ADMIN' &&
            targetUser.status === USER_STATUS.ACTIVE &&
            data.status &&
            data.status !== USER_STATUS.ACTIVE) {
            await this.ensureNotLastActiveAdmin();
        }
        if (data.email) {
            await this.ensureEmailAvailable(data.email, id);
        }
        const userData = {};
        if (data.firstName !== undefined)
            userData.firstName = data.firstName;
        if (data.lastName !== undefined)
            userData.lastName = data.lastName;
        if (data.email !== undefined)
            userData.email = data.email;
        if (data.phone !== undefined)
            userData.phone = data.phone;
        if (data.avatar !== undefined)
            userData.avatar = data.avatar;
        if (data.status !== undefined)
            userData.status = data.status;
        if (data.roleId !== undefined) {
            userData.role = nextRole;
        }
        await this.dataSource.transaction(async (manager) => {
            if (Object.keys(userData).length > 0) {
                await manager.update(user_entity_1.User, id, userData);
            }
            if (this.hasEmployeeProfileUpdates(data)) {
                const employee = await manager.findOne(employee_entity_1.Employee, {
                    where: { userId: id },
                });
                if (!employee) {
                    throw new common_1.BadRequestException('Target user does not have an employee profile');
                }
                if (data.departmentId) {
                    const department = await manager.findOne(department_entity_1.Department, {
                        where: { departmentId: data.departmentId },
                    });
                    if (!department) {
                        throw new common_1.NotFoundException('Department not found');
                    }
                    employee.department = department;
                }
                if (data.salary !== undefined) {
                    employee.salary = data.salary.toFixed(2);
                }
                if (data.hireDate !== undefined)
                    employee.hireDate = data.hireDate;
                if (data.address !== undefined)
                    employee.address = data.address;
                await manager.save(employee);
            }
        });
        return this.findProfile(id);
    }
    async delete(id, currentUser) {
        const user = await this.userRepo.findOne({
            where: { userId: id },
            relations: ['role'],
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const currentRole = this.toRoleName(currentUser.role);
        const targetRole = this.toRoleName(user.role.roleName);
        const isSelf = currentUser.userId === id;
        if (currentRole !== 'ADMIN') {
            throw new common_1.ForbiddenException('Only admins can deactivate users');
        }
        if (isSelf) {
            if (user.status === USER_STATUS.ACTIVE &&
                targetRole === 'ADMIN') {
                await this.ensureNotLastActiveAdmin();
            }
        }
        else if (!this.isLowerRole(currentRole, targetRole)) {
            throw new common_1.ForbiddenException('You can only deactivate lower-role users');
        }
        if (user.status !== USER_STATUS.INACTIVE) {
            await this.userRepo.update(id, {
                status: USER_STATUS.INACTIVE,
            });
        }
        return {
            message: 'User deactivated successfully',
        };
    }
    async getUserForAuthorization(id) {
        const user = await this.userRepo.findOne({
            where: { userId: id },
            relations: ['role'],
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    hasEmployeeProfileUpdates(data) {
        return EMPLOYEE_PROFILE_FIELDS.some((field) => data[field] !== undefined);
    }
    async authorizeUpdate(currentRole, targetRole, isSelf, data) {
        if (isSelf) {
            if (currentRole === 'ADMIN') {
                this.ensureOnlyAllowedFields(data, ADMIN_SELF_UPDATE_FIELDS);
                return;
            }
            this.ensureOnlyAllowedFields(data, BASIC_PROFILE_FIELDS);
            return;
        }
        if (!this.isLowerRole(currentRole, targetRole)) {
            throw new common_1.ForbiddenException('You can only update lower-role users');
        }
        if (currentRole === 'MANAGER') {
            this.ensureOnlyAllowedFields(data, MANAGER_UPDATE_FIELDS);
            return;
        }
        if (currentRole !== 'ADMIN') {
            throw new common_1.ForbiddenException('You cannot manage other users');
        }
    }
    ensureOnlyAllowedFields(data, allowedFields) {
        const allowed = new Set(allowedFields);
        const forbiddenFields = Object.keys(data)
            .filter((field) => !allowed.has(field));
        if (forbiddenFields.length > 0) {
            throw new common_1.ForbiddenException(`You cannot update: ${forbiddenFields.join(', ')}`);
        }
    }
    async ensureEmailAvailable(email, currentUserId) {
        const existingUser = await this.userRepo.findOne({
            where: { email },
        });
        if (existingUser && existingUser.userId !== currentUserId) {
            throw new common_1.ConflictException('Email already exists');
        }
    }
    ensureValidUserStatus(status) {
        if (status !== USER_STATUS.ACTIVE &&
            status !== USER_STATUS.INACTIVE) {
            throw new common_1.BadRequestException('User status must be active or inactive');
        }
    }
    toUserListStatusFilter(statusFilter) {
        if (statusFilter === USER_STATUS.ACTIVE ||
            statusFilter === USER_STATUS.INACTIVE ||
            statusFilter === 'all') {
            return statusFilter;
        }
        throw new common_1.BadRequestException('User list status filter must be active, inactive, or all');
    }
    async ensureNotLastActiveAdmin() {
        const activeAdminCount = await this.userRepo.count({
            where: {
                status: USER_STATUS.ACTIVE,
                role: {
                    roleName: 'ADMIN',
                },
            },
            relations: ['role'],
        });
        if (activeAdminCount <= 1) {
            throw new common_1.ForbiddenException('Action would remove the last active admin');
        }
    }
    isLowerRole(currentRole, targetRole) {
        return this.roleRank(currentRole) > this.roleRank(targetRole);
    }
    roleRank(role) {
        return ROLE_RANK[this.toRoleName(role)];
    }
    toRoleName(role) {
        if (role in ROLE_RANK) {
            return role;
        }
        throw new common_1.ForbiddenException('Unknown user role');
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(2, (0, typeorm_1.InjectRepository)(department_entity_1.Department)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], UsersService);
