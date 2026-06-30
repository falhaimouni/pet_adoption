import { Controller, Get, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin')
  getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER')
  @Get('manager')
  getManagerDashboard() {
    return this.dashboardService.getManagerDashboard();
  }
}
