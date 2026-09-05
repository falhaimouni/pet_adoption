import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';

import { User } from '../../database/entities/user.entity';
import { OAuthAccount } from '../../database/entities/oauth-account.entity';
import { Role } from '../../database/entities/role.entity';

import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';
import { GoogleStrategy } from './google.strategy';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PassportModule,

    TypeOrmModule.forFeature([
      User,
      OAuthAccount,
      Role,
    ]),

    AuthModule,
  ],

  controllers: [OAuthController],

  providers: [
    OAuthService,
    GoogleStrategy,
  ],
})
export class OAuthModule {}