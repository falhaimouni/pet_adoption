import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager, QueryFailedError, Repository, In} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

import { Department } from '../../database/entities/department.entity';
import { Employee } from '../../database/entities/employee.entity';
import { Role } from '../../database/entities/role.entity';
import { User } from '../../database/entities/user.entity';
import { Friendship } from '../../database/entities/friendship.entity';
import { ActivityLog } from '../../database/entities/activity-log.entity';
import { UploadsService } from '../uploads/uploads.service';
import {
  CreateEmployeeUserDto,
  UpdateProfileDto,
  UpdateUserDto,
} from '@shared/dto/user.dto';
import {
  FRIEND_AUTO_ROLES,
  FRIEND_MANUAL_ROLES,
  FRIEND_SYSTEM_ROLES,
} from '@shared/constants/chat.constants';
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

    @InjectRepository(Friendship)
    private friendshipRepo: Repository<Friendship>,
  
    private readonly uploadsService: UploadsService,
    private dataSource: DataSource,
    @InjectRepository(ActivityLog)
    private activityLogRepo: Repository<ActivityLog>,
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

  async createEmployeeUser(dto: CreateEmployeeUserDto, actorUserId: string) {
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

    let savedUser: User;
    try {
      //all inside {} is one transaction
      savedUser = await this.dataSource.transaction(
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

        await manager.getRepository(ActivityLog).save(
          manager.getRepository(ActivityLog).create({
            userId: actorUserId,
            action: 'USER_CREATED',
            entityType: 'USER',
            entityId: createdUser.userId,
          }),
        );

        return createdUser;
        },
      );
    } catch (error) {
      if (error instanceof QueryFailedError && (error as any).code === '23505') {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }

    await this.syncStaffFriendshipsForUser(savedUser.userId);
    return this.findOne(savedUser.userId);
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const currentUser = await this.userRepo.findOneBy({ userId });
    const previousAvatar = currentUser?.avatar;
    const uploadedFile = await this.uploadsService.createFileRecord(
      file,
      FileUploadCategory.AVATAR,
      userId,
    );

    try {
      const profile = await this.updateProfile(userId, {
        avatar: uploadedFile.fileUrl,
      });
      await this.deletePreviousAvatar(previousAvatar, uploadedFile.fileId);
      return profile;
    } catch (error) {
      await this.userRepo.update(userId, { avatar: previousAvatar ?? null });
      await this.uploadsService.rollbackFileUpload(file.path, uploadedFile.fileId);
      throw error;
    }
  }

  async uploadManagedUserAvatar(
    id: string,
    currentUser: RequestWithUser['user'],
    file: Express.Multer.File,
  ) {
    const targetUser = await this.getUserForAuthorization(id);
    await this.authorizeUpdate(
      this.toRoleName(currentUser.role),
      this.toRoleName(targetUser.role.roleName),
      currentUser.userId === id,
      { avatar: '' },
    );

    const uploadedFile = await this.uploadsService.createFileRecord(
      file,
      FileUploadCategory.AVATAR,
      currentUser.userId,
    );

    const previousAvatar = targetUser.avatar;

    try {
      const updatedUser = await this.updateUser(
        id,
        { avatar: uploadedFile.fileUrl },
        currentUser,
      );
      await this.deletePreviousAvatar(previousAvatar, uploadedFile.fileId);
      return updatedUser;
    } catch (error) {
      await this.userRepo.update(id, { avatar: previousAvatar ?? null });
      await this.uploadsService.rollbackFileUpload(file.path, uploadedFile.fileId);
      throw error;
    }
  }

  private async deletePreviousAvatar(
    avatarUrl: string | null | undefined,
    replacementFileId: string,
  ): Promise<void> {
    if (!avatarUrl || avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
      return;
    }

    const previousFile = await this.uploadsService.findFileByUrl(avatarUrl);

    if (previousFile && previousFile.fileId !== replacementFileId) {
      await this.uploadsService.deleteReplacementFile(previousFile.fileId);
    }
  }

  async updateProfile(id: string, data: UpdateProfileDto) {
    if ('email' in data) {
      throw new ForbiddenException('Email cannot be changed');
    }

    const updateData: Partial<
      Pick<User, 'firstName' | 'lastName' | 'phone' | 'address' | 'avatar'>
    > = {};

    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;

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
    if ('email' in data) {
      throw new ForbiddenException('Email cannot be changed');
    }

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

      this.authorizeRoleAssignment(
        currentRole,
        this.toRoleName(requestedRole.roleName),
        isSelf,
      );

      nextRole = requestedRole;

    }

    const removesActiveAdmin =
      isSelf &&
      targetRole === 'ADMIN' &&
      targetUser.status === USER_STATUS.ACTIVE &&
      ((data.roleId && nextRole.roleName !== 'ADMIN') ||
        (data.status !== undefined && data.status !== USER_STATUS.ACTIVE));

    const userData: Partial<User> = {};

    if (data.firstName !== undefined) userData.firstName = data.firstName;
    if (data.lastName !== undefined) userData.lastName = data.lastName;
    if (data.phone !== undefined) userData.phone = data.phone;
    if (data.avatar !== undefined) userData.avatar = data.avatar;
    if (data.status !== undefined) userData.status = data.status;
    if (data.roleId !== undefined) {
      userData.role = nextRole;
    }

    await this.dataSource.transaction(async (manager) => {
      if (removesActiveAdmin) {
        await this.ensureNotLastActiveAdmin(manager);
      }

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

    await this.syncStaffFriendshipsForUser(id);

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

    if (!isSelf && !this.isLowerRole(currentRole, targetRole)) {
      throw new ForbiddenException(
        'You can only deactivate lower-role users',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      const lockedUser = await manager
        .getRepository(User)
        .createQueryBuilder('user')
        // Role is required, and an inner join keeps FOR UPDATE valid on Postgres.
        .innerJoinAndSelect('user.role', 'role')
        .setLock('pessimistic_write')
        .where('user.userId = :id', { id })
        .getOne();

      if (!lockedUser) {
        throw new NotFoundException('User not found');
      }

      if (
        isSelf &&
        lockedUser.status === USER_STATUS.ACTIVE &&
        targetRole === 'ADMIN'
      ) {
        await this.ensureNotLastActiveAdmin(manager);
      }

      if (lockedUser.status !== USER_STATUS.INACTIVE) {
        await manager.update(User, id, {
          status: USER_STATUS.INACTIVE,
        });

        await manager.getRepository(ActivityLog).save(
          manager.getRepository(ActivityLog).create({
            userId: currentUser.userId,
            action: 'USER_DEACTIVATED',
            entityType: 'USER',
            entityId: id,
          }),
        );
      }
    });

    return {
      message: 'User deactivated successfully',
    };
  }

  async getFriends(currentUser: RequestWithUser['user']) {
    const currentRole = this.toRoleName(currentUser.role);
    this.ensureFriendSystemRole(currentRole);

    const friendships = await this.friendshipRepo.find({
      where: [
        { user1Id: currentUser.userId },
        { user2Id: currentUser.userId },
      ],
      relations: [
        'user1',
        'user1.role',
        'user1.employeeProfile',
        'user1.employeeProfile.department',
        'user2',
        'user2.role',
        'user2.employeeProfile',
        'user2.employeeProfile.department',
      ],
      order: {
        createdAt: 'DESC',
      },
    });

    return friendships.map((friendship) => ({
      friendshipId: friendship.friendshipId,
      isSystemGenerated: friendship.isSystemGenerated,
      createdAt: friendship.createdAt,
      updatedAt: friendship.updatedAt,
      friend: this.stripPassword(
        friendship.user1Id === currentUser.userId
          ? friendship.user2
          : friendship.user1,
      ),
    }));
  }

  async getFriendCandidates(currentUser: RequestWithUser['user']) {
    const currentRole = this.toRoleName(currentUser.role);
    this.ensureFriendSystemRole(currentRole);

    if (!this.canManageFriendsManually(currentRole)) {
      return [];
    }

    const friendships = await this.friendshipRepo.find({
      where: [
        { user1Id: currentUser.userId },
        { user2Id: currentUser.userId },
      ],
      select: {
        user1Id: true,
        user2Id: true,
      },
    });

    const friendIds = new Set<string>([currentUser.userId]);
    for (const friendship of friendships) {
      friendIds.add(
        friendship.user1Id === currentUser.userId
          ? friendship.user2Id
          : friendship.user1Id,
      );
    }

    const candidates = await this.userRepo.find({
      where: {
        status: USER_STATUS.ACTIVE,
        role: {
          roleName: In(FRIEND_MANUAL_ROLES as unknown as string[]),
        },
      },
      relations: ['role', 'employeeProfile', 'employeeProfile.department'],
      order: {
        firstName: 'ASC',
        lastName: 'ASC',
      },
    });

    return candidates
      .filter((user) => !friendIds.has(user.userId))
      .map((user) => this.stripPassword(user));
  }

  async addFriend(
    currentUser: RequestWithUser['user'],
    friendUserId: string,
  ) {
    const currentRole = this.toRoleName(currentUser.role);
    const friendUser = await this.getUserForAuthorization(friendUserId);
    const friendRole = this.toRoleName(friendUser.role.roleName);

    this.ensureFriendSystemRole(currentRole);
    this.ensureFriendSystemRole(friendRole);

    if (currentUser.userId === friendUserId) {
      throw new BadRequestException('You cannot add yourself as a friend');
    }

    if (
      !this.canManageFriendsManually(currentRole) ||
      !this.canManageFriendsManually(friendRole)
    ) {
      throw new ForbiddenException(
        'Only employees and vets can manage manual friendships',
      );
    }

    const existing = await this.getFriendshipByPair(
      currentUser.userId,
      friendUserId,
    );

    if (existing) {
      if (existing.isSystemGenerated) {
        throw new ConflictException('You are already connected');
      }

      throw new ConflictException('Friendship already exists');
    }

    const pair = this.normalizeFriendPair(
      currentUser.userId,
      friendUserId,
    );

    const friendship = await this.friendshipRepo.save(
      this.friendshipRepo.create({
        user1Id: pair.user1Id,
        user2Id: pair.user2Id,
        createdByUserId: currentUser.userId,
        isSystemGenerated: false,
      }),
    );

    return {
      message: 'Friend added successfully',
      friendship: await this.buildFriendshipResponse(
        friendship.friendshipId,
        currentUser.userId,
      ),
    };
  }

  async removeFriend(
    currentUser: RequestWithUser['user'],
    friendUserId: string,
  ) {
    const currentRole = this.toRoleName(currentUser.role);
    const friendRole = await this.getTargetRoleName(friendUserId);

    this.ensureFriendSystemRole(currentRole);
    this.ensureFriendSystemRole(friendRole);

    if (currentUser.userId === friendUserId) {
      throw new BadRequestException('You cannot remove yourself');
    }

    if (
      !this.canManageFriendsManually(currentRole) ||
      !this.canManageFriendsManually(friendRole)
    ) {
      throw new ForbiddenException(
        'Only employees and vets can manage manual friendships',
      );
    }

    const friendship = await this.getFriendshipByPair(
      currentUser.userId,
      friendUserId,
    );

    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    if (friendship.isSystemGenerated) {
      throw new ForbiddenException('System friendships cannot be removed');
    }

    await this.friendshipRepo.delete(friendship.friendshipId);

    return {
      message: 'Friend removed successfully',
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

  private async getTargetRoleName(userId: string) {
    const user = await this.getUserForAuthorization(userId);
    return this.toRoleName(user.role.roleName);
  }

  private async getFriendshipByPair(userId1: string, userId2: string) {
    const pair = this.normalizeFriendPair(userId1, userId2);

    return this.friendshipRepo.findOne({
      where: {
        user1Id: pair.user1Id,
        user2Id: pair.user2Id,
      },
    });
  }

  private async buildFriendshipResponse(
    friendshipId: string,
    currentUserId: string,
  ) {
    const friendship = await this.friendshipRepo.findOne({
      where: { friendshipId },
      relations: [
        'user1',
        'user1.role',
        'user1.employeeProfile',
        'user1.employeeProfile.department',
        'user2',
        'user2.role',
        'user2.employeeProfile',
        'user2.employeeProfile.department',
      ],
    });

    if (!friendship) {
      return null;
    }

    return {
      friendshipId: friendship.friendshipId,
      isSystemGenerated: friendship.isSystemGenerated,
      createdAt: friendship.createdAt,
      updatedAt: friendship.updatedAt,
      friend: this.stripPassword(
        friendship.user1Id === currentUserId ? friendship.user2 : friendship.user1,
      ),
    };
  }

  private async syncStaffFriendshipsForUser(userId: string) {
    const user = await this.userRepo.findOne({
      where: { userId },
      relations: ['role'],
    });

    if (!user || !user.role) {
      return;
    }

    const roleName = this.toRoleName(user.role.roleName);

    if (!this.isFriendSystemRole(roleName)) {
      await this.friendshipRepo
        .createQueryBuilder()
        .delete()
        .from(Friendship)
        .where('user1_id = :userId OR user2_id = :userId', { userId })
        .execute();
      return;
    }

    const targetUsers = await this.userRepo.find({
      where: {
        status: USER_STATUS.ACTIVE,
        role: {
          roleName: In(this.getAutoFriendTargetRoles(roleName) as string[]),
        },
      },
      relations: ['role'],
    });

    for (const targetUser of targetUsers) {
      if (targetUser.userId === userId) {
        continue;
      }

      await this.upsertFriendship(userId, targetUser.userId, true);
    }
  }

  private async upsertFriendship(
    userId1: string,
    userId2: string,
    isSystemGenerated: boolean,
    createdByUserId?: string | null,
  ) {
    const pair = this.normalizeFriendPair(userId1, userId2);
    const existing = await this.friendshipRepo.findOne({
      where: {
        user1Id: pair.user1Id,
        user2Id: pair.user2Id,
      },
    });

    if (existing) {
      if (isSystemGenerated && !existing.isSystemGenerated) {
        existing.isSystemGenerated = true;
        existing.createdByUserId = null;
        await this.friendshipRepo.save(existing);
      }

      return existing;
    }

    return this.friendshipRepo.save(
      this.friendshipRepo.create({
        user1Id: pair.user1Id,
        user2Id: pair.user2Id,
        createdByUserId: createdByUserId ?? null,
        isSystemGenerated,
      }),
    );
  }

  private normalizeFriendPair(userId1: string, userId2: string) {
    return userId1 < userId2
      ? { user1Id: userId1, user2Id: userId2 }
      : { user1Id: userId2, user2Id: userId1 };
  }

  private stripPassword<T extends User>(user: T) {
    const { password: _, ...rest } = user;
    return rest;
  }

  private ensureFriendSystemRole(role: RoleName) {
    if (!this.isFriendSystemRole(role)) {
      throw new ForbiddenException('Adopters do not use the friend system');
    }
  }

  private isFriendSystemRole(role: RoleName) {
    return (FRIEND_SYSTEM_ROLES as readonly string[]).includes(role);
  }

  private canManageFriendsManually(role: RoleName) {
    return (FRIEND_MANUAL_ROLES as readonly string[]).includes(role);
  }

  private getAutoFriendTargetRoles(role: RoleName) {
    if ((FRIEND_AUTO_ROLES as readonly string[]).includes(role)) {
      return FRIEND_SYSTEM_ROLES.filter((candidate) => candidate !== role);
    }

    return FRIEND_AUTO_ROLES;
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

  private authorizeRoleAssignment(
    currentRole: RoleName,
    requestedRole: RoleName,
    isSelf: boolean,
  ) {
    if (currentRole !== 'ADMIN') {
      throw new ForbiddenException('Only admins can assign user roles');
    }

    if (isSelf && requestedRole !== 'ADMIN') {
      return;
    }

    if (!isSelf && !this.isLowerRole(currentRole, requestedRole)) {
      throw new ForbiddenException(
        'You can only assign lower-level roles',
      );
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

  //the manager is the transaction manager, we want it all inside the transaction to ensure that we don't have a race condition
  private async ensureNotLastActiveAdmin(manager: EntityManager) {
    const activeAdmins = await manager
      .getRepository(User)
      .createQueryBuilder('user')
      //join with the role entity
      .innerJoin('user.role', 'role')
      //lock the rows for update to prevent race
      .setLock('pessimistic_write')
      //filter for active admins
      .where('user.status = :status', { status: USER_STATUS.ACTIVE })
      .andWhere('role.roleName = :roleName', { roleName: 'ADMIN' })
      //run the query and get the results
      .getMany();

    const activeAdminCount = activeAdmins.length;

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
