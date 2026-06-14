export declare class LoginDto {
    email: string;
    password: string;
}
export declare class RegisterDto {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
}
export declare class SignupDto extends RegisterDto {
    confirmPassword: string;
}
export declare class PasswordResetDto {
    email: string;
}
export declare class PasswordResetConfirmDto {
    token: string;
    newPassword: string;
    confirmPassword: string;
}
export declare class RefreshTokenDto {
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
        roleName: string;
    };
}
