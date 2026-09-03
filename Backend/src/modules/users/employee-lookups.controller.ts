import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Department } from '../../database/entities/department.entity';
import { Role } from '../../database/entities/role.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller()
export class EmployeeLookupsController {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
  ) {}

  @Get('roles')
  async getAssignableRoles() {
    return this.roleRepo.find({
      where: {
        roleName: In(['MANAGER', 'EMPLOYEE', 'VET']),
        isActive: true,
      },
      select: {
        roleId: true,
        roleName: true,
      },
      order: {
        roleName: 'ASC',
      },
    });
  }

  @Get('departments')
  async getActiveDepartments() {
    return this.departmentRepo.find({
      where: {
        isActive: true,
      },
      select: {
        departmentId: true,
        departmentName: true,
      },
      order: {
        departmentName: 'ASC',
      },
    });
  }
}
