import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { UpdateProfileDto, UpdateUserDto } from '@shared/dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  findAll() {
    return this.userRepo.find({
      relations: ['role'],
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
      },
    });
  }

  async findOne(id: string) {
    const user = await this.userRepo.findOne({
      where: { userId: id },
      relations: ['role'],
    });
    if (!user) throw new NotFoundException('User not found');
    
    const { password: _, ...result } = user;
    return result;
  }

  async findProfile(id: string) {
    return this.findOne(id);
  }

  //user updates own profile
  async updateProfile(id: string, data: UpdateProfileDto) {
    await this.userRepo.update(id, data);

    return this.findProfile(id);
  }

  //ADMIN/MANAGER updates any user
  async updateUser(id: string, data: UpdateUserDto) {
    await this.userRepo.update(id, data);

    return this.findProfile(id);
  }

  async delete(id: string) {
  const user = await this.userRepo.findOne({
    where: { userId: id },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  await this.userRepo.remove(user);

  return {
    message: 'User deleted successfully',
  };
}
}