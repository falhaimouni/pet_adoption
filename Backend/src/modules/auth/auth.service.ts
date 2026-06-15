//for signup and login, bcrypt pass and create JWT token
import { Injectable, UnauthorizedException, ConflictException, NotFoundException, OnModuleInit, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { User } from '../../database/entities/user.entity';
import { LoginDto, SignupDto } from '@shared/dto/auth.dto';
import { Role } from '../../database/entities/role.entity';
import { ERROR_MESSAGES } from '@shared/constants/error-messages.constants';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private adopterRole!: Role;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    
    private readonly jwtService: JwtService,
  ) {}

  async onModuleInit() {
    const role = await this.roleRepo.findOne({
      where: { roleName: 'ADOPTER' },
    });

    if (!role) {
      this.logger.error('ADOPTER role not found in database. Signup will fail until roles are seeded.');
      return;
    }
    this.adopterRole = role;
  }

  async signup(dto: SignupDto) {
    if (!this.adopterRole) {
      await this.onModuleInit(); // Try to initialize again
      if (!this.adopterRole) throw new InternalServerErrorException('System roles not initialized');
    }

    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepo.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: hashedPassword,
      phone: dto.phone,
      role: this.adopterRole,
      status: 'active',
    });

    await this.userRepo.save(user);

    return { message: 'User created successfully' };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      relations: ['role'],
    });

    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    if (!user.role) {
      throw new UnauthorizedException('User role missing');
    }

    //create JWT token
    const payload = {
      sub: user.userId,
      email: user.email, //user.role is guaranteed to exist here
      role: user.role.roleName,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleName: user.role.roleName, //user.role is guaranteed to exist here
      },
    };
  }

  //take the user type and remove the password field before returning
  async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    const user = await this.userRepo.findOne({
      where: { userId },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    //JS obj destructuring
    //remove password before returning
    const { password: _, ...result } = user;
    return result;
  }
}