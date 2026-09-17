import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { DataSource, QueryFailedError, Repository } from 'typeorm';

import { User } from '../../database/entities/user.entity';
import { Adopter } from '../../database/entities/adopter.entity';
import { ActivityLog } from '../../database/entities/activity-log.entity';
import { OAuthAccount } from '../../database/entities/oauth-account.entity';
import { Role } from '../../database/entities/role.entity';
import { AuthService } from '../auth/auth.service';

type GoogleUserData = {
  providerUserId: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  avatar?: string | null;
};

type OAuthAuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roleName: string;
  };
};

type PendingOAuthSession = {
  auth: OAuthAuthResponse;
  expiresAt: number;
};

const OAUTH_SESSION_TTL_MS = 60_000;

@Injectable()
export class OAuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(OAuthAccount)
    private readonly oauthAccountRepo: Repository<OAuthAccount>,

    @InjectRepository(ActivityLog)
    private readonly activityLogRepo: Repository<ActivityLog>,

    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @InjectDataSource()
    private readonly dataSource: DataSource,

    private readonly authService: AuthService,

    private readonly configService: ConfigService,
  ) {}

  private readonly pendingSessions = new Map<string, PendingOAuthSession>();

  async validateGoogleUser(googleUser: GoogleUserData) {
    const {
      providerUserId,
      email,
      emailVerified,
      firstName,
      lastName,
      avatar,
    } = googleUser;

    if (!emailVerified) {
      throw new UnauthorizedException(
        'Google email must be verified before signing in',
      );
    }

    //check whether this Google account already exists
    const existingOAuthAccount = await this.oauthAccountRepo.findOne({
      where: {
        provider: 'GOOGLE',
        providerUserId,
      },
      //load the user and their role to check if they are active and have a valid role
      relations: ['user', 'user.role'],
    });

    //if it exists return the user and issue JWTs
    if (existingOAuthAccount) {
      const user = existingOAuthAccount.user;

      if (user?.provider === 'LOCAL') {
        throw new ConflictException(
          'An account with this email already exists. Please sign in using your existing login method.',
        );
      }

      if (
        !user ||
        user.status !== 'active' ||
        !user.role ||
        user.role.isActive === false
      ) {
        throw new UnauthorizedException('Inactive or invalid account');
      }

      return this.authService.createAuthTokens(user.userId);
    }

    //google account is new but the email already belongs to a user
    const existingUser = await this.userRepo.findOne({
      where: { email },
      relations: ['role'],
    });

    if (existingUser) {
      if (existingUser.provider === 'LOCAL') {
        throw new ConflictException(
          'An account with this email already exists. Please sign in using your existing login method.',
        );
      }

      if (
        existingUser.status !== 'active' ||
        !existingUser.role ||
        existingUser.role.isActive === false
      ) {
        throw new UnauthorizedException('Inactive or invalid account');
      }

      throw new ConflictException(
        'An account with this email already exists. Please sign in with Google.',
      );
    }

    //no user exists -> create a new adopter account
    const adopterRole = await this.roleRepo.findOne({
      where: {
        //find the adopter role
        roleName: 'ADOPTER',
        isActive: true,
      },
    });

    if (!adopterRole) {
      throw new ConflictException('ADOPTER role is not configured');
    }

    //create the user
    const newUser = this.userRepo.create({
      firstName,
      lastName,
      email,
      password: null,
      avatar: avatar ?? null,
      provider: 'GOOGLE',
      roleId: adopterRole.roleId,
      role: adopterRole,
      status: 'active',
    });

    let savedUser: User;
    try {
      savedUser = await this.dataSource.transaction(async (manager) => {
        const createdUser = await manager.getRepository(User).save(newUser);
        await manager.getRepository(OAuthAccount).save(
          manager.getRepository(OAuthAccount).create({
            userId: createdUser.userId,
            provider: 'GOOGLE',
            providerUserId,
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
            userId: null,
            action: 'USER_CREATED',
            entityType: 'USER',
            entityId: createdUser.userId,
          }),
        );
        return createdUser;
      });
    } catch (error) {
      if (error instanceof QueryFailedError && (error as any).code === '23505') {
        const concurrentAccount = await this.oauthAccountRepo.findOne({
          where: { provider: 'GOOGLE', providerUserId },
        });
        if (concurrentAccount) {
          return this.authService.createAuthTokens(concurrentAccount.userId);
        }
      }
      throw error;
    }

    //issue our normal application JWTs
    return this.authService.createAuthTokens(savedUser.userId);
  }

  createFrontendRedirect(auth: OAuthAuthResponse): string {
    const code = randomBytes(32).toString('hex');
    this.pendingSessions.set(code, {
      auth,
      expiresAt: Date.now() + OAUTH_SESSION_TTL_MS,
    });

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    const redirectUrl = new URL(frontendUrl);
    redirectUrl.hash = `/oauth-callback?code=${encodeURIComponent(code)}`;
    return redirectUrl.toString();
  }

  consumeFrontendSession(code: string): OAuthAuthResponse {
    this.pruneExpiredSessions();

    const pending = this.pendingSessions.get(code);
    this.pendingSessions.delete(code);

    if (!pending || pending.expiresAt < Date.now()) {
      throw new UnauthorizedException('Invalid or expired OAuth session');
    }

    return pending.auth;
  }

  private pruneExpiredSessions(): void {
    const now = Date.now();
    for (const [code, pending] of this.pendingSessions.entries()) {
      if (pending.expiresAt < now) {
        this.pendingSessions.delete(code);
      }
    }
  }

  private today() {
    return new Date().toISOString().slice(0, 10);
  }
}
