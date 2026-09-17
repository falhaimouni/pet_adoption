import {
  Controller,
  Delete,
  Get,
  Param,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';

import { RequestWithUser } from '@shared/types/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';
import { UploadsService } from './uploads.service';

@Controller('files')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Get(':fileId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE', 'VET', 'ADOPTER')
  async getFile(
    @Param('fileId') fileId: string,
    @Req() req: RequestWithUser,
    @Res() response: Response,
  ): Promise<void> {
    const { file, filePath } = await this.uploadsService.getFileForUser(
      fileId,
      req.user,
    );

    response.setHeader('Content-Type', file.mimeType ?? 'application/octet-stream');
    response.sendFile(filePath);
  }

  @Delete(':fileId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE', 'VET', 'ADOPTER')
  deleteFile(
    @Param('fileId') fileId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.uploadsService.deleteFile(fileId, req.user);
  }
}