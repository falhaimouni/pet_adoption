import { Injectable } from '@nestjs/common';
import {
  collectDefaultMetrics,
  Counter,
  Histogram,
  Registry,
} from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry = new Registry();

  private readonly httpRequestsTotal = new Counter({
    name: 'pet_adoption_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [this.registry],
  });

  private readonly httpRequestDuration = new Histogram({
    name: 'pet_adoption_http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [this.registry],
  });

  constructor() {
    collectDefaultMetrics({
      register: this.registry,
      prefix: 'pet_adoption_',
    });
  }

  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    durationSeconds: number,
  ) {
    const labels = {
      method,
      route,
      status_code: String(statusCode),
    };

    this.httpRequestsTotal.inc(labels);

    this.httpRequestDuration.observe(labels, durationSeconds);
  }

  getContentType() {
    return this.registry.contentType;
  }

  async getMetrics() {
    return this.registry.metrics();
  }
}
