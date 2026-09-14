import { Body, Controller, Post, Get, UseGuards, Req } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, SignupDto } from '@shared/dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RequestWithUser } from '@shared/types/auth.types';
import { ChangePasswordDto } from '@shared/dto/change-password.dto';
import { ForgotPasswordDto } from '@shared/dto/forgot-password.dto';
import { ResetPasswordDto } from '@shared/dto/reset-password.dto';

@UseGuards(ThrottlerGuard)
@Throttle({ default: { ttl: 60_000, limit: 20 } })
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  //protected route, only request that pass JWT auth check
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: RequestWithUser) {
    return this.authService.getProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(@Req() req: RequestWithUser, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Req() req: RequestWithUser) {
    return this.authService.logout(req.user.userId);
  }

  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @Post(['forgot-password', 'forget-password'])
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
