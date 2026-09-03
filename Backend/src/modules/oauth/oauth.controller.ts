import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsString, MinLength } from 'class-validator';
import { Response } from 'express';
import { OAuthService } from './oauth.service';

type OAuthAuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roleName: string;
  };
};

class CompleteGoogleOAuthDto {
  @IsString()
  @MinLength(1)
  code!: string;
}

@Controller('auth/google')
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) {}

  //1 redirect the user to google's login page
  @Get()
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    //passport handles the redirect to google
  }

  //2 google redirects the user back here
  @Get('callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: Response) {
    const auth = req.user as OAuthAuthResponse;
    const redirectUrl = this.oauthService.createFrontendRedirect(auth);
    return res.redirect(302, redirectUrl);
  }

  @Post('session')
  completeGoogleLogin(@Body() dto: CompleteGoogleOAuthDto) {
    return this.oauthService.consumeFrontendSession(dto.code);
  }
}
