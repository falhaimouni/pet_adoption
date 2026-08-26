import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';

import { User } from '../../database/entities/user.entity';
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

@Injectable()
export class OAuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(OAuthAccount)
    private readonly oauthAccountRepo: Repository<OAuthAccount>,

    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @InjectDataSource()
    private readonly dataSource: DataSource,

    private readonly authService: AuthService,
  ) {}

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
      if (
        existingUser.status !== 'active' ||
        !existingUser.role ||
        existingUser.role.isActive === false
      ) {
        throw new UnauthorizedException('Inactive or invalid account');
      }

      //only an account with a local password can be linked to Google
      if (!existingUser.password) {
        throw new UnauthorizedException('Invalid OAuth account');
      }

      const oauthAccount = this.oauthAccountRepo.create({
        userId: existingUser.userId,
        provider: 'GOOGLE',
        providerUserId,
      });

      try {
        await this.oauthAccountRepo.save(oauthAccount);
      } catch (error) {
        if (!(error instanceof QueryFailedError && (error as any).code === '23505')) {
          throw error;
        }
      }

      return this.authService.createAuthTokens(existingUser.userId);
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
}