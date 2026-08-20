import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

import { OAuthService } from './oauth.service';

@Injectable()
//tell passport to use the google strategy and name it 'google'
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly oauthService: OAuthService,
  ) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

    if (!clientID || !clientSecret || !callbackURL) {
      throw new InternalServerErrorException(
        'Google OAuth environment variables are not configured',
      );
    }

    //asking google for the user's profile and email
    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['profile', 'email'],
    });
  }

  //google gives passport access token and refresh token but we don't use them because we don't need to keep talking with google, we just need the profile info
  //this app has permission to access the user's profile and email(tokens)
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ) {
    const { id, name, emails, photos } = profile;

    //get the first email's value, but safely.
    //?. optional chaining operator, if emails is undefined or null, it won't crash, it will just return undefined
    const googleEmail = emails?.[0];
    const email = googleEmail?.value;

    if (!email) {
      throw new InternalServerErrorException(
        'Google account did not provide an email address',
      );
    }

    if (googleEmail?.verified !== true) {
      throw new UnauthorizedException(
        'Google email must be verified before signing in',
      );
    }

    //convert it to our app data
    //google has authenticated this person, so we can trust it pass to oauth service
    return this.oauthService.validateGoogleUser({
        //better than using the user's name
      providerUserId: id,
      email,
      //?? if the left side is null or undefined use '' empty string instead
      firstName: name?.givenName ?? '',
      lastName: name?.familyName ?? '',
      avatar: photos?.[0]?.value ?? null,
      emailVerified: true,
    });
  }
}