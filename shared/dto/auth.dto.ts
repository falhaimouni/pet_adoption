export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  roleId?: string;
}

export interface SignupDto extends RegisterDto {
  confirmPassword: string;
}

export interface PasswordResetDto {
  email: string;
}

export interface PasswordResetConfirmDto {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}