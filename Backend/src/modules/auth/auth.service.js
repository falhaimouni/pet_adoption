"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_1 = require("@nestjs/jwt");
const crypto_1 = require("crypto");
const bcrypt = __importStar(require("bcrypt"));
const typeorm_2 = require("typeorm");
const error_messages_constants_1 = require("../../../../shared/constants/error-messages.constants");
const password_reset_token_entity_1 = require("../../database/entities/password-reset-token.entity");
const role_entity_1 = require("../../database/entities/role.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const mail_service_1 = require("../mail/mail.service");
let AuthService = AuthService_1 = class AuthService {
    constructor(userRepo, roleRepo, passwordResetTokenRepo, jwtService, configService, mailService) {
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
        this.passwordResetTokenRepo = passwordResetTokenRepo;
        this.jwtService = jwtService;
        this.configService = configService;
        this.mailService = mailService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async onModuleInit() {
        const role = await this.roleRepo.findOne({
            where: { roleName: 'ADOPTER' },
        });
        if (!role) {
            this.logger.error('ADOPTER role not found in database. Signup will fail until roles are seeded.');
            return;
        }
        this.adopterRole = role;
    }
    async signup(dto) {
        if (!this.adopterRole) {
            await this.onModuleInit();
            if (!this.adopterRole) {
                throw new common_1.InternalServerErrorException('System roles not initialized');
            }
        }
        const existing = await this.userRepo.findOne({
            where: { email: dto.email },
        });
        if (existing) {
            throw new common_1.ConflictException(error_messages_constants_1.ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const user = this.userRepo.create({
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email,
            password: hashedPassword,
            phone: dto.phone,
            role: this.adopterRole,
            status: 'active',
            provider: 'LOCAL',
        });
        await this.userRepo.save(user);
        return { message: 'User created successfully' };
    }
    async login(dto) {
        const user = await this.userRepo.findOne({
            where: { email: dto.email },
            relations: ['role'],
        });
        if (!user) {
            throw new common_1.UnauthorizedException(error_messages_constants_1.ERROR_MESSAGES.INVALID_CREDENTIALS);
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException(error_messages_constants_1.ERROR_MESSAGES.INVALID_CREDENTIALS);
        }
        if (user.status !== 'active') {
            throw new common_1.UnauthorizedException(error_messages_constants_1.ERROR_MESSAGES.UNAUTHORIZED);
        }
        if (!user.role) {
            throw new common_1.UnauthorizedException('User role missing');
        }
        const tokens = this.issueTokens(user);
        return {
            ...tokens,
            user: {
                id: user.userId,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                roleName: user.role.roleName,
            },
        };
    }
    async refresh(dto) {
        let payload;
        try {
            payload = await this.jwtService.verifyAsync(dto.refreshToken, {
                secret: this.getRefreshTokenSecret(),
            });
        }
        catch {
            throw new common_1.UnauthorizedException(error_messages_constants_1.ERROR_MESSAGES.INVALID_TOKEN);
        }
        if (payload.typ !== 'refresh') {
            throw new common_1.UnauthorizedException(error_messages_constants_1.ERROR_MESSAGES.INVALID_TOKEN);
        }
        const user = await this.userRepo.findOne({
            where: { userId: payload.sub },
            relations: ['role'],
        });
        if (!user || user.status !== 'active' || !user.role) {
            throw new common_1.UnauthorizedException('Inactive or invalid account');
        }
        if (payload.tokenVersion !== user.refreshTokenVersion) {
            throw new common_1.UnauthorizedException(error_messages_constants_1.ERROR_MESSAGES.INVALID_TOKEN);
        }
        return this.issueTokens(user);
    }
    async getProfile(userId) {
        const user = await this.userRepo.findOne({
            where: { userId },
            relations: ['role'],
        });
        if (!user) {
            throw new common_1.NotFoundException(error_messages_constants_1.ERROR_MESSAGES.USER_NOT_FOUND);
        }
        const { password: _, ...result } = user;
        return result;
    }
    async changePassword(userId, dto) {
        const user = await this.userRepo.findOne({
            where: { userId },
        });
        if (!user) {
            throw new common_1.NotFoundException(error_messages_constants_1.ERROR_MESSAGES.USER_NOT_FOUND);
        }
        this.assertPasswordActionsAllowed(user.provider);
        if (dto.newPassword !== dto.confirmPassword) {
            throw new common_1.ConflictException('Passwords do not match');
        }
        const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new common_1.UnauthorizedException(error_messages_constants_1.ERROR_MESSAGES.INVALID_CREDENTIALS);
        }
        const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
        await this.userRepo.update(userId, {
            password: hashedPassword,
        });
        await this.invalidateRefreshTokens(userId);
        return { message: 'Password changed successfully' };
    }
    async forgotPassword(dto) {
        const user = await this.userRepo.findOne({ where: { email: dto.email } });
        //ALWAYS return the same success response to avoid revealing account existence
        const genericResponse = {
            message: 'If an account with that email exists, you will receive a password reset link.',
        };
        if (!user) {
            return genericResponse;
        }
        //do not allow password actions for non-local providers — but don't reveal this
        if (user.provider === 'GOOGLE') {
            return genericResponse;
        }
        await this.passwordResetTokenRepo.delete({ userId: user.userId });
        //generate raw token and hashed token
        const rawToken = (0, crypto_1.randomBytes)(32).toString('hex');
        const tokenHash = this.hashResetToken(rawToken);
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
        const tokenEntity = this.passwordResetTokenRepo.create({
            user,
            userId: user.userId,
            tokenHash,
            expiresAt,
        });
        await this.passwordResetTokenRepo.save(tokenEntity);
        const frontendUrl = this.configService.get('FRONTEND_URL') ?? 'http://localhost:5175';
        const resetLink = `${frontendUrl}/#/reset-password?token=${rawToken}`;
        await this.mailService.sendPasswordResetEmail(user.email, resetLink);
        return genericResponse;
    }
    async resetPassword(dto) {
        const { token, newPassword, confirmPassword } = dto;
        if (newPassword !== confirmPassword) {
            throw new common_1.BadRequestException('Passwords do not match');
        }
        const tokenHash = this.hashResetToken(token);
        const tokenRecord = await this.passwordResetTokenRepo.findOne({
            where: { tokenHash },
            relations: ['user'],
        });
        if (!tokenRecord) {
            throw new common_1.BadRequestException('Invalid or expired token');
        }
        if (tokenRecord.usedAt) {
            throw new common_1.BadRequestException('Token already used');
        }
        if (tokenRecord.expiresAt.getTime() < Date.now()) {
            throw new common_1.BadRequestException('Token expired');
        }
        const user = tokenRecord.user;
        if (!user) {
            throw new common_1.BadRequestException('Invalid token');
        }
        //ensure provider allows password actions
        this.assertPasswordActionsAllowed(user.provider);
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.userRepo.update(user.userId, { password: hashedPassword });
        await this.invalidateRefreshTokens(user.userId);
        await this.passwordResetTokenRepo.update(tokenRecord.tokenId, {
            usedAt: new Date(),
        });
        return { message: 'Password has been reset successfully' };
    }
    issueTokens(user) {
        const basePayload = {
            sub: user.userId,
            email: user.email,
            role: user.role.roleName,
            tokenVersion: user.refreshTokenVersion,
        };
        return {
            accessToken: this.jwtService.sign({ ...basePayload, typ: 'access' }, { expiresIn: '1d' }),
            refreshToken: this.jwtService.sign({ ...basePayload, typ: 'refresh' }, {
                secret: this.getRefreshTokenSecret(),
                expiresIn: '7d',
            }),
        };
    }
    getRefreshTokenSecret() {
        return (this.configService.get('JWT_REFRESH_SECRET') ??
            this.configService.get('JWT_SECRET'));
    }
    async invalidateRefreshTokens(userId) {
        await this.userRepo.increment({ userId }, 'refreshTokenVersion', 1);
    }
    assertPasswordActionsAllowed(provider) {
        if (provider === 'GOOGLE') {
            throw new common_1.ForbiddenException('Google accounts cannot use password-based actions');
        }
    }
    hashResetToken(token) {
        return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(2, (0, typeorm_1.InjectRepository)(password_reset_token_entity_1.PasswordResetToken)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService,
        mail_service_1.MailService])
], AuthService);
