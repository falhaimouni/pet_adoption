import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    if (request.path === '/metrics') {
      return next.handle();
    }

    const start = process.hrtime.bigint();

    response.once('finish', () => {
      const end = process.hrtime.bigint();

      const durationSeconds =
        Number(end - start) / 1_000_000_000;

      const route =
        request.route?.path ??
        request.path ??
        'unknown';

      this.metricsService.recordHttpRequest(
        request.method,
        route,
        response.statusCode,
        durationSeconds,
      );
    });

    return next.handle();
  }
}
