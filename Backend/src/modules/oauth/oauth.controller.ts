import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OAuthService } from './oauth.service';

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
  async googleCallback(@Req() req: any) {
    return req.user;
  }
}