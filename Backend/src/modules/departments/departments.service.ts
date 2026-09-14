import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';

import { Department } from '../../database/entities/department.entity';
import { Employee } from '../../database/entities/employee.entity';
import {
  AssignDepartmentUsersDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from '@shared/dto/department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    private readonly dataSource: DataSource,
  ) {}

  findAll(activeOnly = false) {
    return this.departmentRepo.find({
      where: activeOnly ? { isActive: true } : {},
      relations: ['manager', 'employees', 'employees.user', 'employees.user.role'],
      order: { departmentName: 'ASC' },
    }).then((departments) => departments.map((department) => this.serialize(department)));
  }

  async findOne(departmentId: string) {
    const department = await this.departmentRepo.findOne({
      where: { departmentId },
      relations: ['manager', 'employees', 'employees.user', 'employees.user.role'],
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return this.serialize(department);
  }

  async create(dto: CreateDepartmentDto) {
    const departmentName = this.normalizeName(dto.departmentName);
    this.ensureNameIsNotBlank(departmentName);
    const existingDepartment = await this.departmentRepo
      .createQueryBuilder('department')
      .where('LOWER(BTRIM(department.department_name)) = LOWER(BTRIM(:departmentName))', {
        departmentName,
      })
      .getOne();

    if (existingDepartment) {
      throw new ConflictException('Department name already exists');
    }

    const department = this.departmentRepo.create({
      ...dto,
      departmentName,
    });
    return this.serialize(await this.saveDepartment(department));
  }

  async update(departmentId: string, dto: UpdateDepartmentDto) {
    const department = await this.departmentRepo.findOne({
      where: { departmentId },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const departmentName = dto.departmentName === undefined
      ? undefined
      : this.normalizeName(dto.departmentName);

    if (departmentName !== undefined) {
      this.ensureNameIsNotBlank(departmentName);
    }

    if (
      departmentName !== undefined &&
      this.normalizeName(departmentName) !==
        this.normalizeName(department.departmentName)
    ) {
      const existingDepartment = await this.departmentRepo
        .createQueryBuilder('department')
        .where('LOWER(BTRIM(department.department_name)) = LOWER(BTRIM(:departmentName))', {
          departmentName,
        })
        .andWhere('department.department_id <> :departmentId', {
          departmentId,
        })
        .getOne();

      if (existingDepartment) {
        throw new ConflictException('Department name already exists');
      }
    }

    Object.assign(department, {
      ...dto,
      ...(departmentName === undefined ? {} : { departmentName }),
    });
    return this.serialize(await this.saveDepartment(department));
  }

  async remove(departmentId: string) {
    await this.dataSource.transaction(async (manager) => {
      const department = await manager
        .getRepository(Department)
        .createQueryBuilder('department')
        .setLock('pessimistic_write')
        .where('department.department_id = :departmentId', { departmentId })
        .getOne();

      if (!department) {
        throw new NotFoundException('Department not found');
      }

      if (!department.isActive) {
        return;
      }

      const employeeCount = await manager.getRepository(Employee).count({
        where: { departmentId },
      });

      if (employeeCount > 0) {
        throw new BadRequestException(
          'Move or remove department users before deleting the department',
        );
      }

      department.isActive = false;
      await manager.save(department);
    });

    return { message: 'Department deleted successfully' };
  }

  async assignUsers(departmentId: string, dto: AssignDepartmentUsersDto) {
    const uniqueUserIds = [...new Set(dto.userIds)];
    return this.dataSource.transaction(async (manager) => {
      const department = await manager
        .getRepository(Department)
        .createQueryBuilder('department')
        .setLock('pessimistic_write')
        .where('department.department_id = :departmentId', { departmentId })
        .getOne();

      if (!department || !department.isActive) {
        throw new NotFoundException('Active department not found');
      }

      const employees = await manager.find(Employee, {
        where: uniqueUserIds.map((userId) => ({ userId })),
        relations: ['user', 'user.role'],
      });

      if (employees.length !== uniqueUserIds.length) {
        const foundUserIds = new Set(employees.map((employee) => employee.userId));
        const missingUserIds = uniqueUserIds.filter(
          (userId) => !foundUserIds.has(userId),
        );
        throw new BadRequestException(
          `Users do not have employee profiles: ${missingUserIds.join(', ')}`,
        );
      }

      const inactiveEmployees = employees.filter(
        (employee) => employee.user.status !== 'active',
      );
      if (inactiveEmployees.length > 0) {
        throw new BadRequestException('Inactive users cannot be assigned to a department');
      }

      await manager
        .createQueryBuilder()
        .update(Employee)
        .set({ departmentId })
        .where('user_id IN (:...userIds)', { userIds: uniqueUserIds })
        .execute();

      const updatedDepartment = await manager.findOne(Department, {
        where: { departmentId },
        relations: ['manager', 'employees', 'employees.user', 'employees.user.role'],
      });

      return updatedDepartment ? this.serialize(updatedDepartment) : null;
    });
  }

  private normalizeName(name: string) {
    return name.trim();
  }

  private ensureNameIsNotBlank(name: string) {
    if (!name) {
      throw new BadRequestException('Department name cannot be blank');
    }
  }

  private async saveDepartment(department: Department) {
    try {
      return await this.departmentRepo.save(department);
    } catch (error) {
      if (error instanceof QueryFailedError && (error as any).code === '23505') {
        throw new ConflictException('Department name already exists');
      }
      throw error;
    }
  }

  private serialize(department: Department) {
    return {
      ...department,
      manager: department.manager
        ? this.withoutPassword(department.manager)
        : department.manager,
      employees: department.employees?.map((employee) => ({
        ...employee,
        user: employee.user ? this.withoutPassword(employee.user) : employee.user,
      })),
    };
  }

  private withoutPassword<T extends { password: string | null }>(user: T) {
    const { password: _password, ...safeUser } = user;
    return safeUser;
  }

}
