import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

function Match(property: string, validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'Match',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return (args.object as Record<string, unknown>)[relatedPropertyName] === value;
        },
      },
    });
  };
}

const STRONG_PASSWORD_MESSAGE =
  'password must contain at least one uppercase letter, one lowercase letter, one number, and one symbol';

function StrongPassword() {
  return Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message: STRONG_PASSWORD_MESSAGE,
  });
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
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

export class PasswordResetDto {
  @IsEmail()
  email!: string;
}

export class PasswordResetConfirmDto {
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
