import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  Body,
  Query,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { multerOptions } from '../uploads/multer.config';
import {
  CreateEmployeeUserDto,
  UpdateProfileDto,
  UpdateUserDto,
} from '@shared/dto/user.dto';
import { RequestWithUser } from '@shared/types/auth.types';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  //any logged in user
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: RequestWithUser) {
    return this.usersService.findProfile(req.user.userId);
  }

  //any logged in user
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(
      req.user.userId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile/avatar')
  @UseInterceptors(
    FileInterceptor('file', multerOptions),
  )
  async uploadAvatar(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.uploadAvatar(req.user.userId, file);
  }

  //ADMIN/MANAGER ONLY
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @Get()
  findAll(
    @Req() req: RequestWithUser,
    @Query('status') status?: string,
  ) {
    return this.usersService.findAll(req.user, status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('employees')
  createEmployeeUser(@Body() dto: CreateEmployeeUserDto) {
    return this.usersService.createEmployeeUser(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @Get(':id')
  findOne(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    return this.usersService.findOne(id, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @Patch(':id')
  updateUser(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(id, dto, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  delete(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    return this.usersService.delete(id, req.user);
  }
}
