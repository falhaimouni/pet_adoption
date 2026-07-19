import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../../database/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    const secret = configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET is not defined in environment variables');
    }

    super({
        //inside request header, the token should be in the format "Bearer <token>"
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: secret,
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    role: string;
    tokenVersion: number;
    typ?: 'access' | 'refresh';
  }) {
    if (payload.typ === 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.userRepo.findOne({
      where: { userId: payload.sub },
      relations: ['role'],
    });

    if (!user || user.status !== 'active' || !user.role || user.role.isActive === false) {
      throw new UnauthorizedException('Inactive or invalid account');
    }

    if (payload.tokenVersion !== user.refreshTokenVersion) {
      throw new UnauthorizedException('Invalid token');
    }

    return {
      userId: user.userId,
      email: user.email,
      role: user.role.roleName,
    };
  }
}
