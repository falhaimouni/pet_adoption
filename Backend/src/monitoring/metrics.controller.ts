import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  async getMetrics(@Res() response: Response) {
    response.setHeader(
      'Content-Type',
      this.metricsService.getContentType(),
    );

    response.send(await this.metricsService.getMetrics());
  }
}
