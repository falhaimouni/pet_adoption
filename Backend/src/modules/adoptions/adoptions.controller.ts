import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { CreateAdoptionRequestDto } from '@shared/dto/adoption-request.dto';
import { RequestWithUser } from '@shared/types/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';
import { AdoptionsService } from './adoptions.service';

@Controller('adoption')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdoptionsController {
  constructor(private readonly adoptionsService: AdoptionsService) {}

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE', 'ADOPTER')
  @Get('requests')
  findRequests(@Req() req: RequestWithUser) {
    return this.adoptionsService.findRequests(req.user);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE', 'ADOPTER')
  @Get('requests/:requestId')
  findRequest(
    @Param('requestId') requestId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.adoptionsService.findRequest(requestId, req.user);
  }

  @Roles('ADOPTER')
  @Post('requests')
  createRequest(
    @Body() dto: CreateAdoptionRequestDto,
    @Req() req: RequestWithUser,
  ) {
    return this.adoptionsService.createRequest(req.user.userId, dto);
  }

  @Roles('ADOPTER')
  @Patch('requests/:requestId/cancel')
  cancelRequest(
    @Param('requestId') requestId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.adoptionsService.cancelRequest(requestId, req.user.userId);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Post('requests/:requestId/approve')
  approveRequest(
    @Param('requestId') requestId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.adoptionsService.approveRequest(requestId, req.user.userId);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Post('requests/:requestId/reject')
  rejectRequest(
    @Param('requestId') requestId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.adoptionsService.rejectRequest(requestId, req.user.userId);
  }
}
