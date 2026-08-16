import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { RequestWithUser } from '@shared/types/auth.types';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findMine(@Req() req: RequestWithUser) {
    return this.notificationsService.findMine(req.user);
  }

  @Get('unread-count')
  getUnreadCount(@Req() req: RequestWithUser) {
    return this.notificationsService.getUnreadCount(req.user);
  }

  @Patch(':notificationId/read')
  markAsRead(
    @Param('notificationId') notificationId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.notificationsService.markAsRead(notificationId, req.user);
  }

  @Patch('read-all')
  markAllAsRead(@Req() req: RequestWithUser) {
    return this.notificationsService.markAllAsRead(req.user);
  }
}
