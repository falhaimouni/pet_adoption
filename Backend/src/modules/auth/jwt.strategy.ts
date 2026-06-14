import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
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

  validate(payload: { sub: string; email: string; role: string }) {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}