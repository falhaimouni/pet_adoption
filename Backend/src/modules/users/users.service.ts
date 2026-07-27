import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Department } from '../../database/entities/department.entity';
import { Employee } from '../../database/entities/employee.entity';
import { Role } from '../../database/entities/role.entity';
import { User } from '../../database/entities/user.entity';
import { UploadsService } from '../uploads/uploads.service';
import {
  CreateEmployeeUserDto,
  UpdateProfileDto,
  UpdateUserDto,
} from '@shared/dto/user.dto';
import { RequestWithUser } from '@shared/types/auth.types';
import { FileUploadCategory } from '@shared/enums';

type RoleName = 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'VET' | 'ADOPTER';
type UserListStatusFilter = 'active' | 'inactive' | 'all';

const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

const ROLE_RANK: Record<RoleName, number> = {
  ADMIN: 4,
  MANAGER: 3,
  EMPLOYEE: 2,
  VET: 2,
  ADOPTER: 1,
};

const EMPLOYEE_PROFILE_FIELDS: Array<keyof UpdateUserDto> = [
  'departmentId',
  'salary',
  'hireDate',
  'address',
];

const BASIC_PROFILE_FIELDS: Array<keyof UpdateUserDto> = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'avatar',
];

const MANAGER_UPDATE_FIELDS: Array<keyof UpdateUserDto> = [
  ...BASIC_PROFILE_FIELDS,
  ...EMPLOYEE_PROFILE_FIELDS,
  'status',
];

const ADMIN_SELF_UPDATE_FIELDS: Array<keyof UpdateUserDto> = [
  ...BASIC_PROFILE_FIELDS,
  'roleId',
  'status',
];

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Role)
    private roleRepo: Repository<Role>,

    @InjectRepository(Department)
    private departmentRepo: Repository<Department>,

    private readonly uploadsService: UploadsService,
    private dataSource: DataSource,
  ) {}

  async findAll(
    currentUser: RequestWithUser['user'],
    statusFilter: string = USER_STATUS.ACTIVE,
  ) {
    const normalizedStatusFilter =
      this.toUserListStatusFilter(statusFilter);
    const currentRole = this.toRoleName(currentUser.role);

    const users = await this.userRepo.find({
      where:
        normalizedStatusFilter === 'all'
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

    return users.filter((user) =>
      this.isLowerRole(currentRole, user.role.roleName),
    );
  }

  async findOne(id: string, currentUser?: RequestWithUser['user']) {
    const user = await this.userRepo.findOne({
      where: { userId: id },
      relations: ['role', 'employeeProfile', 'employeeProfile.department'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (
      currentUser &&
      currentUser.userId !== id &&
      currentUser.role !== 'ADMIN' &&
      !this.isLowerRole(currentUser.role, user.role.roleName)
    ) {
      throw new ForbiddenException(
        'You can only access lower-role users',
      );
    }

    const { password: _, ...result } = user;
    return result;
  }

  async findProfile(id: string) {
    return this.findOne(id);
  }

  async createEmployeeUser(dto: CreateEmployeeUserDto) {
    if (dto.status !== undefined) {
      this.ensureValidUserStatus(dto.status);
    }

    const existingUser = await this.userRepo.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const role = await this.roleRepo.findOne({
      where: { roleId: dto.roleId, isActive: true },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const roleName = this.toRoleName(role.roleName);

    if (roleName === 'ADOPTER' || roleName === 'ADMIN') {
      throw new BadRequestException(
        'Admin can only create manager, employee, or vet users with employee profiles',
      );
    }

    const department = await this.departmentRepo.findOne({
      where: { departmentId: dto.departmentId, isActive: true },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const savedUser = await this.dataSource.transaction(
      async (manager) => {
        const user = manager.create(User, {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          password: hashedPassword,
          phone: dto.phone,
          role,
          status: dto.status ?? USER_STATUS.ACTIVE,
        });

        const createdUser = await manager.save(user);

        const employee = manager.create(Employee, {
          user: createdUser,
          department,
          salary:
            dto.salary === undefined
              ? undefined
              : dto.salary.toFixed(2),
          hireDate: dto.hireDate,
          address: dto.address,
        });

        await manager.save(employee);

        return createdUser;
      },
    );

    return this.findOne(savedUser.userId);
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const uploadedFile = await this.uploadsService.createFileRecord(
      file,
      FileUploadCategory.AVATAR,
      userId,
    );

    return this.updateProfile(userId, {
      avatar: uploadedFile.fileUrl,
    });
  }

  async updateProfile(id: string, data: UpdateProfileDto) {
    const updateData: Partial<
      Pick<User, 'firstName' | 'lastName' | 'email' | 'phone' | 'avatar'>
    > = {};

    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;

    if (updateData.email) {
      await this.ensureEmailAvailable(updateData.email, id);
    }

    if (Object.keys(updateData).length > 0) {
      await this.userRepo.update(id, updateData);
    }

    return this.findProfile(id);
  }

  async updateUser(
    id: string,
    data: UpdateUserDto,
    currentUser: RequestWithUser['user'],
  ) {
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
        where: { roleId: data.roleId, isActive: true },
      });

      if (!requestedRole) {
        throw new NotFoundException('Role not found');
      }

      nextRole = requestedRole;

      if (
        isSelf &&
        targetRole === 'ADMIN' &&
        nextRole.roleName !== 'ADMIN'
      ) {
        await this.ensureNotLastActiveAdmin();
      }
    }

    if (
      isSelf &&
      currentRole === 'ADMIN' &&
      targetUser.status === USER_STATUS.ACTIVE &&
      data.status &&
      data.status !== USER_STATUS.ACTIVE
    ) {
      await this.ensureNotLastActiveAdmin();
    }

    if (data.email) {
      await this.ensureEmailAvailable(data.email, id);
    }

    const userData: Partial<User> = {};

    if (data.firstName !== undefined) userData.firstName = data.firstName;
    if (data.lastName !== undefined) userData.lastName = data.lastName;
    if (data.email !== undefined) userData.email = data.email;
    if (data.phone !== undefined) userData.phone = data.phone;
    if (data.avatar !== undefined) userData.avatar = data.avatar;
    if (data.status !== undefined) userData.status = data.status;
    if (data.roleId !== undefined) {
      userData.role = nextRole;
    }

    await this.dataSource.transaction(async (manager) => {
      if (Object.keys(userData).length > 0) {
        await manager.update(User, id, userData);
      }

      if (this.hasEmployeeProfileUpdates(data)) {
        const employee = await manager.findOne(Employee, {
          where: { userId: id },
        });

        if (!employee) {
          throw new BadRequestException(
            'Target user does not have an employee profile',
          );
        }

        if (data.departmentId) {
          const department = await manager.findOne(Department, {
            where: { departmentId: data.departmentId, isActive: true },
          });

          if (!department) {
            throw new NotFoundException('Department not found');
          }

          employee.department = department;
        }

        if (data.salary !== undefined) {
          employee.salary = data.salary.toFixed(2);
        }
        if (data.hireDate !== undefined) employee.hireDate = data.hireDate;
        if (data.address !== undefined) employee.address = data.address;

        await manager.save(employee);
      }
    });

    return this.findProfile(id);
  }

  async delete(id: string, currentUser: RequestWithUser['user']) {
    const user = await this.userRepo.findOne({
      where: { userId: id },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentRole = this.toRoleName(currentUser.role);
    const targetRole = this.toRoleName(user.role.roleName);
    const isSelf = currentUser.userId === id;

    if (currentRole !== 'ADMIN') {
      throw new ForbiddenException('Only admins can deactivate users');
    }

    if (isSelf) {
      if (
        user.status === USER_STATUS.ACTIVE &&
        targetRole === 'ADMIN'
      ) {
        await this.ensureNotLastActiveAdmin();
      }
    } else if (!this.isLowerRole(currentRole, targetRole)) {
      throw new ForbiddenException(
        'You can only deactivate lower-role users',
      );
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

  private async getUserForAuthorization(id: string) {
    const user = await this.userRepo.findOne({
      where: { userId: id },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private hasEmployeeProfileUpdates(data: UpdateUserDto) {
    return EMPLOYEE_PROFILE_FIELDS.some(
      (field) => data[field] !== undefined,
    );
  }

  private async authorizeUpdate(
    currentRole: RoleName,
    targetRole: RoleName,
    isSelf: boolean,
    data: UpdateUserDto,
  ) {
    if (isSelf) {
      if (currentRole === 'ADMIN') {
        this.ensureOnlyAllowedFields(data, ADMIN_SELF_UPDATE_FIELDS);
        return;
      }

      this.ensureOnlyAllowedFields(data, BASIC_PROFILE_FIELDS);
      return;
    }

    if (!this.isLowerRole(currentRole, targetRole)) {
      throw new ForbiddenException(
        'You can only update lower-role users',
      );
    }

    if (currentRole === 'MANAGER') {
      this.ensureOnlyAllowedFields(data, MANAGER_UPDATE_FIELDS);
      return;
    }

    if (currentRole !== 'ADMIN') {
      throw new ForbiddenException('You cannot manage other users');
    }
  }

  private ensureOnlyAllowedFields(
    data: UpdateUserDto,
    allowedFields: Array<keyof UpdateUserDto>,
  ) {
    const allowed = new Set<keyof UpdateUserDto>(allowedFields);
    const forbiddenFields = (Object.keys(data) as Array<keyof UpdateUserDto>)
      .filter((field) => !allowed.has(field));

    if (forbiddenFields.length > 0) {
      throw new ForbiddenException(
        `You cannot update: ${forbiddenFields.join(', ')}`,
      );
    }
  }

  private async ensureEmailAvailable(email: string, currentUserId: string) {
    const existingUser = await this.userRepo.findOne({
      where: { email },
    });

    if (existingUser && existingUser.userId !== currentUserId) {
      throw new ConflictException('Email already exists');
    }
  }

  private ensureValidUserStatus(status: string) {
    if (
      status !== USER_STATUS.ACTIVE &&
      status !== USER_STATUS.INACTIVE
    ) {
      throw new BadRequestException(
        'User status must be active or inactive',
      );
    }
  }

  private toUserListStatusFilter(
    statusFilter: string,
  ): UserListStatusFilter {
    if (
      statusFilter === USER_STATUS.ACTIVE ||
      statusFilter === USER_STATUS.INACTIVE ||
      statusFilter === 'all'
    ) {
      return statusFilter;
    }

    throw new BadRequestException(
      'User list status filter must be active, inactive, or all',
    );
  }

  private async ensureNotLastActiveAdmin() {
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
      throw new ForbiddenException(
        'Action would remove the last active admin',
      );
    }
  }

  private isLowerRole(currentRole: string, targetRole: string) {
    return this.roleRank(currentRole) > this.roleRank(targetRole);
  }

  private roleRank(role: string) {
    return ROLE_RANK[this.toRoleName(role)];
  }

  private toRoleName(role: string): RoleName {
    if (role in ROLE_RANK) {
      return role as RoleName;
    }

    throw new ForbiddenException('Unknown user role');
  }
}
