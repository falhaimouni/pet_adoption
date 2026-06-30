import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getStatus() {
    return this.appService.getStatus();
  }

  @Get('health')
  getLiveness() {
    return { status: 'alive' };
  }

  @Get('ready')
  async getReadiness() {
    const db = await this.appService.checkDb();
    return { status: db.ok ? 'ready' : 'not_ready', db };
  }

  @Get('version')
  getVersion() {
    return { version: this.appService.getVersion() };
  }
}
