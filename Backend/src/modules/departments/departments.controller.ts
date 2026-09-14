import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  AssignDepartmentUsersDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from '@shared/dto/department.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';
import { DepartmentsService } from './departments.service';

@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  findAll(@Query('active') active?: string) {
    return this.departmentsService.findAll(active === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.departmentsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }

  @Patch(':id/users')
  assignUsers(
    @Param('id') id: string,
    @Body() dto: AssignDepartmentUsersDto,
  ) {
    return this.departmentsService.assignUsers(id, dto);
  }

  @Patch(':id/:userId')
  assignUser(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ) {
    return this.departmentsService.assignUsers(id, { userIds: [userId] });
  }
}
