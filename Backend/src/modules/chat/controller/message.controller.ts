import {Controller, Get, Post, Body, Param, Req, UseGuards, Patch} from '@nestjs/common';
import {MessageService} from './../services/message.service';
import { SendMessageDto } from '@shared/dto';
import { RequestWithUser } from '@shared/types/auth.types';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { RolesGuard } from 'src/modules/roles/roles.guard';
import { Roles } from 'src/modules/roles/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('conversations')
export class MessageController {
  constructor(private readonly msgService: MessageService) {}


  @Post(':id/messages')
  @Roles('ADOPTER', 'EMPLOYEE')
  sendMessage(
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto,
    @Req() req: RequestWithUser)
  {
    return this.msgService.sendMessage(conversationId, req.user.userId, req.user.role, dto);
  }

  @Get(':id/messages')
  @Roles('ADOPTER', 'EMPLOYEE', 'ADMIN', 'MANAGER')
  getMessages(@Param('id') conversationId: string, @Req() req: RequestWithUser) {
    return this.msgService.getMessages(conversationId, req.user.userId, req.user.role);
  }

  @Patch(':id/messages/read')
  @Roles('ADOPTER', 'EMPLOYEE', 'ADMIN', 'MANAGER')
  async markMessagesAsRead(@Param('id') conversationId: string, @Req() req: RequestWithUser) {
    return this.msgService.markMessagesAsRead(conversationId, req.user.userId, req.user.role);
  }

}