
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../../database/entities/user.entity';
import { Department } from '../../database/entities/department.entity';
import { Employee } from '../../database/entities/employee.entity';
import { Role } from '../../database/entities/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Department, Employee])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
