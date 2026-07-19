import { IsString, MaxLength, MinLength } from 'class-validator';
import { StrongPassword } from '../validators/strong-password.validator';
import { Match } from '../validators/match.validator';

export class ResetPasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  token!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(255)
  @StrongPassword()
  newPassword!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(255)
  @Match('newPassword', { message: 'confirmPassword must match newPassword' })
  confirmPassword!: string;
}
