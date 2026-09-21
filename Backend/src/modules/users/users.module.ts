
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { EmployeeLookupsController } from './employee-lookups.controller';
import { User } from '../../database/entities/user.entity';
import { Department } from '../../database/entities/department.entity';
import { Employee } from '../../database/entities/employee.entity';
import { ActivityLog } from '../../database/entities/activity-log.entity';
import { Role } from '../../database/entities/role.entity';
import { UploadsModule } from '../uploads/uploads.module';
import { Friendship } from '../../database/entities/friendship.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Department, Employee, Friendship, ActivityLog]),
    UploadsModule,
  ],
  controllers: [UsersController, EmployeeLookupsController],
  providers: [UsersService],
})
export class UsersModule {}
