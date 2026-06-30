import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { appConfig } from './config';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly dataSource: DataSource,
    @Inject(appConfig.KEY) private readonly app: ConfigType<typeof appConfig>,
  ) {}

  getStatus() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: this.app.version,
      nodeEnv: this.app.nodeEnv,
    };
  }

  getVersion() {
    return this.app.version;
  }

  async checkDb(): Promise<{ ok: boolean; message?: string }> {
    if (!this.dataSource) {
      return { ok: false, message: 'no datasource configured' };
    }

    try {
      await this.dataSource.query('SELECT 1');
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn('DB readiness check failed: ' + msg);
      return { ok: false, message: msg };
    }
  }
}
