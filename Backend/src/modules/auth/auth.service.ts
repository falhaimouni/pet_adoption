import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { ERROR_MESSAGES } from '@shared/constants/error-messages.constants';
import { ChangePasswordDto } from '@shared/dto/change-password.dto';
import { ForgotPasswordDto } from '@shared/dto/forgot-password.dto';
import { ResetPasswordDto } from '@shared/dto/reset-password.dto';
import { LoginDto, RefreshTokenDto, SignupDto } from '@shared/dto/auth.dto';
import { PasswordResetToken } from '../../database/entities/password-reset-token.entity';
import { Role } from '../../database/entities/role.entity';
import { User } from '../../database/entities/user.entity';
import { MailService } from '../mail/mail.service';

type AuthTokenPayload = {
  sub: string;
  email: string;
  role: string;
  tokenVersion: number;
  typ: 'access' | 'refresh';
};

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private adopterRole!: Role;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepo: Repository<PasswordResetToken>,

    private readonly jwtService: JwtService,

    private readonly configService: ConfigService,

    private readonly mailService: MailService,
  ) {}

  async onModuleInit() {
    const role = await this.roleRepo.findOne({
      where: { roleName: 'ADOPTER', isActive: true },
    });

    if (!role) {
      this.logger.error(
        'ADOPTER role not found in database. Signup will fail until roles are seeded.',
      );
      return;
    }

    this.adopterRole = role;
  }

  async signup(dto: SignupDto) {
    if (!this.adopterRole) {
      await this.onModuleInit();
      if (!this.adopterRole) {
        throw new InternalServerErrorException('System roles not initialized');
      }
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
      provider: 'LOCAL',
    });

    await this.userRepo.save(user);

    return { message: 'User created successfully' };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      relations: ['role'],
    });

    if (!user || !user.role || user.role.isActive === false) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    if (user.provider === 'GOOGLE') {
      throw new UnauthorizedException('Please sign in with Google');
    }

    if (!user.password) {
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

    const tokens = this.issueTokens(user);

    return {
      ...tokens,
      user: {
        id: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleName: user.role.roleName,
      },
    };
  }

  async refresh(dto: RefreshTokenDto) {
    let payload: AuthTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<AuthTokenPayload>(
        dto.refreshToken,
        {
          secret: this.getRefreshTokenSecret(),
        },
      );
    } catch {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_TOKEN);
    }

    if (payload.typ !== 'refresh') {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_TOKEN);
    }

    const user = await this.userRepo.findOne({
      where: { userId: payload.sub },
      relations: ['role'],
    });

    if (!user || user.status !== 'active' || !user.role) {
      throw new UnauthorizedException('Inactive or invalid account');
    }

    if (payload.tokenVersion !== user.refreshTokenVersion) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_TOKEN);
    }

    return this.issueTokens(user);
  }

  async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    const user = await this.userRepo.findOne({
      where: { userId },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const { password: _, ...result } = user;
    return result;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userRepo.findOne({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    this.assertPasswordActionsAllowed(user.provider);

    if (!user.password) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    if (dto.newPassword !== dto.confirmPassword) {
      throw new ConflictException('Passwords do not match');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.userRepo.update(userId, {
      password: hashedPassword,
    });
    await this.invalidateRefreshTokens(userId);

    return { message: 'Password changed successfully' };
  }

  async logout(userId: string) {
    const user = await this.userRepo.findOne({ where: { userId } });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    await this.invalidateRefreshTokens(userId);

    return { message: 'Logged out successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });

    //ALWAYS return the same success response to avoid revealing account existence
    const genericResponse = {
      message:
        'If an account with that email exists, you will receive a password reset link.',
    };

    if (!user) {
      return genericResponse;
    }

    //do not allow password actions for non-local providers — but don't reveal this
    if (user.provider === 'GOOGLE') {
      return genericResponse;
    }

    await this.passwordResetTokenRepo.delete({ userId: user.userId });

    //generate raw token and hashed token
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashResetToken(rawToken);

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    const tokenEntity = this.passwordResetTokenRepo.create({
      user,
      userId: user.userId,
      tokenHash,
      expiresAt,
    });

    await this.passwordResetTokenRepo.save(tokenEntity);

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5175';
    const resetLink = `${frontendUrl}/#/reset-password?token=${rawToken}`;

    await this.mailService.sendPasswordResetEmail(user.email, resetLink);

    return genericResponse;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { token, newPassword, confirmPassword } = dto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const tokenHash = this.hashResetToken(token);

    const tokenRecord = await this.passwordResetTokenRepo.findOne({
      where: { tokenHash },
      relations: ['user'],
    });

    if (!tokenRecord) {
      throw new BadRequestException('Invalid or expired token');
    }

    if (tokenRecord.usedAt) {
      throw new BadRequestException('Token already used');
    }

    if (tokenRecord.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Token expired');
    }

    const user = tokenRecord.user;
    if (!user) {
      throw new BadRequestException('Invalid token');
    }

    //ensure provider allows password actions
    this.assertPasswordActionsAllowed(user.provider);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.userRepo.update(user.userId, { password: hashedPassword });
    await this.invalidateRefreshTokens(user.userId);

    await this.passwordResetTokenRepo.update(tokenRecord.tokenId, {
      usedAt: new Date(),
    });

    return { message: 'Password has been reset successfully' };
  }

  async createAuthTokens(userId: string) {
    const user = await this.userRepo.findOne({
      where: { userId },
      relations: ['role'],
    });

    if (!user || !user.role) {
      throw new UnauthorizedException('Invalid user');
    }

    return this.issueTokens(user);
  }

  private issueTokens(user: User) {
    const basePayload = {
      sub: user.userId,
      email: user.email,
      role: user.role.roleName,
      tokenVersion: user.refreshTokenVersion,
    };

    const accessTokenExpiry =
      this.configService.get<string>('JWT_EXPIRES_IN') ?? '1h';
    const refreshTokenExpiry =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';

    return {
      accessToken: this.jwtService.sign(
        { ...basePayload, typ: 'access' },
        ({ expiresIn: accessTokenExpiry } as unknown) as any,
      ),
      refreshToken: this.jwtService.sign(
        { ...basePayload, typ: 'refresh' },
        ({
          secret: this.getRefreshTokenSecret(),
          expiresIn: refreshTokenExpiry,
        } as unknown) as any,
      ),
    };
  }

  private getRefreshTokenSecret() {
    return (
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      this.configService.get<string>('JWT_SECRET')
    );
  }

  private async invalidateRefreshTokens(userId: string) {
    await this.userRepo.increment({ userId }, 'refreshTokenVersion', 1);
  }

  private assertPasswordActionsAllowed(provider?: string | null) {
    if (provider === 'GOOGLE') {
      throw new ForbiddenException(
        'Google accounts cannot use password-based actions',
      );
    }
  }

  private hashResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

}
