import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { Response } from 'express';
import { OAuthService } from './oauth.service';

@Catch()
@Injectable()
export class OAuthRedirectExceptionFilter implements ExceptionFilter {
  constructor(private readonly oauthService: OAuthService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const message = this.getMessage(exception);
    const redirectUrl = this.oauthService.createFrontendErrorRedirect(message);
    return response.redirect(302, redirectUrl);
  }

  private getMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      if (typeof body === 'string') return body;
      if (body && typeof body === 'object' && 'message' in body) {
        const message = (body as { message?: string | string[] }).message;
        return Array.isArray(message) ? message.join(' ') : message || 'Google sign-in failed.';
      }
    }

    if (exception instanceof Error) return exception.message;
    return 'Google sign-in failed.';
  }
}
