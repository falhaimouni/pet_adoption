import {Controller, Get, Post, Body, Param, Patch, Delete, Query, Req, UseGuards} from '@nestjs/common';
import { RequestWithUser } from '@shared/types/auth.types';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { RolesGuard } from 'src/modules/roles/roles.guard';
import { Roles } from 'src/modules/roles/roles.decorator';
import { ConversationService } from '../services/conversation.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('conversations')
export class ConversationController {
  constructor(private readonly convService: ConversationService) {}

  @Post()
  @Roles('ADOPTER')
  async createConversation(@Req() req: RequestWithUser) {
    return this.convService.createConversation(req.user.userId);
  }

  @Get('my')
  @Roles('ADOPTER')
  async getMyConversations(@Req() req: RequestWithUser) {
    return this.convService.getMyConversations(req.user.userId);
  }

  @Get('inbox')
  @Roles('EMPLOYEE', 'ADMIN', 'MANAGER')
  async getEmployeeConversations(@Req() req: RequestWithUser) {
    return this.convService.getEmployeeConversations();
  }

  // @Post(':id/assign')
  // @Roles('EMPLOYEE', 'ADMIN', 'MANAGER')
  // async assignConversation(
  //   @Param('id') conversationId: string,
  //   @Req() req: RequestWithUser)
  // {
  //   return this.convService.assignConversation(conversationId, req.user.userId);
  // }
  
  @Get(':id')
  @Roles('ADOPTER', 'EMPLOYEE', 'ADMIN', 'MANAGER')
  async getConversation(
    @Param('id') conversationId: string,
    @Req() req: RequestWithUser)
  {
    return this.convService.getConversation(conversationId, req.user.userId, req.user.role);
  }

  // @Patch(':id/close')
  // @Roles('EMPLOYEE', 'ADMIN', 'MANAGER')
  // async closeConversation(
  //   @Param('id') conversationId: string,
  //   @Req() req: RequestWithUser)
  // {
  //   return this.convService.closeConversation(conversationId, req.user.userId);
  // }

  @Patch(':id/release')
  @Roles('EMPLOYEE', 'ADMIN', 'MANAGER')
  async releaseConversation(
    @Param('id') conversationId: string,
    @Req() req: RequestWithUser)
  {
    return this.convService.releaseConversation(conversationId, req.user.userId);
  }
}