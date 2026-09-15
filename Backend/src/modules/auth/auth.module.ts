import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { User } from '../../database/entities/user.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { Role } from '../../database/entities/role.entity';
import { PasswordResetToken } from '../../database/entities/password-reset-token.entity';
import { ActivityLog } from '../../database/entities/activity-log.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, Role, PasswordResetToken, ActivityLog]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: ({
          expiresIn:
            configService.get<number | string>('JWT_EXPIRES_IN') ?? '1h',
        } as unknown) as any,
      }),
    }),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}