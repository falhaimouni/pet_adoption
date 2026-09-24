import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { StrongPassword } from '../validators/strong-password.validator';
import { Match } from '../validators/match.validator';

export class LoginDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  password!: string;
}

export class RegisterDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(255)
  @StrongPassword()
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}

export class SignupDto extends RegisterDto {
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  @Match('password', { message: 'confirmPassword must match password' })
  confirmPassword!: string;
}

export class RefreshTokenDto {
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roleName: string;
  };
}

export class EmailTokenDto {
  @IsString()
  @Matches(/^[a-f0-9]{64}$/)
  token!: string;
}
