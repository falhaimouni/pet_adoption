import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { DataSource, QueryFailedError, Repository } from 'typeorm';

import { ERROR_MESSAGES } from '@shared/constants/error-messages.constants';
import { ChangePasswordDto } from '@shared/dto/change-password.dto';
import { ForgotPasswordDto } from '@shared/dto/forgot-password.dto';
import { ResetPasswordDto } from '@shared/dto/reset-password.dto';
import { LoginDto, RefreshTokenDto, SignupDto } from '@shared/dto/auth.dto';
import { PasswordResetToken } from '../../database/entities/password-reset-token.entity';
import { Role } from '../../database/entities/role.entity';
import { User } from '../../database/entities/user.entity';
import { Adopter } from '../../database/entities/adopter.entity';
import { ActivityLog } from '../../database/entities/activity-log.entity';
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

    @InjectRepository(ActivityLog)
    private readonly activityLogRepo: Repository<ActivityLog>,

    @InjectDataSource()
    private readonly dataSource: DataSource,

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
      if (existing.provider === 'GOOGLE') {
        throw new ConflictException(
          'An account with this email already exists. Please sign in with Google.',
        );
      }

      if (existing.emailVerified === false && existing.status === 'active') {
        await this.refreshVerificationLink(existing);
        return { message: 'Verification email sent. Check your inbox before signing in.' };
      }

      throw new ConflictException(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const verificationToken = randomBytes(32).toString('hex');

    try {
      await this.dataSource.transaction(async (manager) => {
        const createdUser = await manager.getRepository(User).save(
          manager.getRepository(User).create({
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email,
            password: hashedPassword,
            phone: dto.phone,
            role: this.adopterRole,
            status: 'active',
            provider: 'LOCAL',
            emailVerified: false,
            emailVerificationHash: this.hashResetToken(verificationToken),
            emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          }),
        );

        await manager.getRepository(Adopter).save(
          manager.getRepository(Adopter).create({
            userId: createdUser.userId,
            registrationDate: this.today(),
          }),
        );

        await manager.getRepository(ActivityLog).save(
          manager.getRepository(ActivityLog).create({
            userId: createdUser.userId,
            action: 'USER_CREATED',
            entityType: 'USER',
            entityId: createdUser.userId,
          }),
        );
      });
    } catch (error) {
      if (error instanceof QueryFailedError && (error as any).code === '23505') {
        throw new ConflictException(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
      }
      throw error;
    }

    await this.deliverVerificationEmail(dto.email, verificationToken);
    return { message: 'Account created. Verification email sent.' };
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
      throw new UnauthorizedException(
        'An account with this email already exists. Please sign in with Google.',
      );
    }

    if (!user.password) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    if (user.emailVerified === false) {
      throw new ForbiddenException('Please verify your email before signing in.');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    if (!user.role) {
      throw new UnauthorizedException('User role missing');
    }

    const tokens = this.issueTokens(user);

    await this.activityLogRepo.save(
      this.activityLogRepo.create({
        userId: user.userId,
        action: 'LOGIN',
        entityType: 'USER',
        entityId: user.userId,
      }),
    );

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

    if (!user.password) {
      throw new ForbiddenException(
        'This account does not have a local password',
      );
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

    await this.dataSource.transaction(async manager => {
      // Serializes against heartbeat's user lock and invalidates every old session.
      await manager.getRepository(User).increment({ userId }, 'refreshTokenVersion', 1);
      await manager.query('DELETE FROM user_presence WHERE user_id=$1', [userId]);
    });

    await this.activityLogRepo.save(
      this.activityLogRepo.create({
        userId,
        action: 'LOGOUT',
        entityType: 'USER',
        entityId: userId,
      }),
    );

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

    //do not issue reset tokens for accounts without a local password
    if (!user.password) {
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
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    const resetLink = `${frontendUrl}/#/reset-password?token=${rawToken}`;

    await this.mailService.sendPasswordResetEmail(user.email, resetLink);

    return genericResponse;
  }

  async resendVerification(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (user && user.emailVerified === false && user.status === 'active') {
      await this.refreshVerificationLink(user);
    }
    return { message: 'If your account needs verification, a new link has been sent.' };
  }

  async verifyEmail(token: string) {
    const result = await this.userRepo.createQueryBuilder()
      .update(User)
      .set({ emailVerified: true, emailVerificationHash: null, emailVerificationExpiresAt: null })
      .where('email_verification_hash = :hash', { hash: this.hashResetToken(token) })
      .andWhere('email_verified = false')
      .andWhere('email_verification_expires_at > :now', { now: new Date() })
      .execute();
    if (!result.affected) throw new BadRequestException('Invalid or expired verification link. Request a new link.');
    return { message: 'Email verified. You can now sign in.' };
  }

  private async sendVerificationEmail(email: string, token: string) {
    const url = new URL(this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173');
    url.hash = `/verify-email?token=${token}`;
    await this.mailService.sendVerificationEmail(email, url.toString());
  }

  private async refreshVerificationLink(user: User) {
    const token = randomBytes(32).toString('hex');
    await this.userRepo.update({ userId: user.userId, emailVerified: false }, {
      emailVerificationHash: this.hashResetToken(token),
      emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    await this.deliverVerificationEmail(user.email, token);
  }

  private async deliverVerificationEmail(email: string, token: string) {
    try {
      await this.sendVerificationEmail(email, token);
    } catch (error) {
      this.logger.error(
        `Verification email delivery failed for ${email}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new ServiceUnavailableException(
        'Account was saved, but we could not send the verification email. Please try resend verification in a moment.',
      );
    }
  }

  async passwordResetContext(token: string) {
    const record = await this.passwordResetTokenRepo.findOne({
      where: { tokenHash: this.hashResetToken(token) }, relations: ['user'],
    });
    if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now() || !record.user) {
      throw new BadRequestException('Invalid or expired token');
    }
    return { email: record.user.email };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { token, newPassword, confirmPassword } = dto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const tokenHash = this.hashResetToken(token);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.dataSource.transaction(async (manager) => {
      const tokenRecord = await manager
        .getRepository(PasswordResetToken)
        .createQueryBuilder('token')
        .innerJoinAndSelect('token.user', 'user')
        .setLock('pessimistic_write')
        .where('token.tokenHash = :tokenHash', { tokenHash })
        .getOne();

      if (!tokenRecord) throw new BadRequestException('Invalid or expired token');
      if (tokenRecord.usedAt) throw new BadRequestException('Token already used');
      if (tokenRecord.expiresAt.getTime() < Date.now()) throw new BadRequestException('Token expired');

      const user = tokenRecord.user;
      if (!user) throw new BadRequestException('Invalid token');
      if (!user.password) {
        throw new ForbiddenException('This account does not have a local password');
      }

      await manager.getRepository(User).update(user.userId, {
        password: hashedPassword,
      });
      await manager
        .getRepository(User)
        .increment({ userId: user.userId }, 'refreshTokenVersion', 1);
      await manager.getRepository(PasswordResetToken).update(tokenRecord.tokenId, {
        usedAt: new Date(),
      });
    });

    return { message: 'Password has been reset successfully' };
  }

  async createAuthTokens(userId: string) {
    const user = await this.userRepo.findOne({
      where: { userId },
      relations: ['role'],
    });

    if (
      !user ||
      user.status !== 'active' ||
      !user.role ||
      user.role.isActive === false
    ) {
      throw new UnauthorizedException('Invalid user');
    }

    return {
      ...this.issueTokens(user),
      user: {
        id: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleName: user.role.roleName,
      },
    };
  }

  private issueTokens(user: User) {
    if (user.emailVerified === false) {
      throw new ForbiddenException('Please verify your email before signing in.');
    }
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

  private hashResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private today() {
    return new Date().toISOString().slice(0, 10);
  }

}
