import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ParseFilePipe } from '@nestjs/common';

import {
  CreateMedicalEntryDto,
  UpdateMedicalEntryDto,
} from '@shared/dto/medical-record.dto';
import { RequestWithUser } from '@shared/types/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';
import { createMulterOptions } from '../uploads/multer.config';
import { MedicalService } from './medical.service';
import { FileUploadCategory } from '@shared/enums';

@Controller()
export class MedicalController {
  constructor(private readonly medicalService: MedicalService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'VET')
  @Get('pets/:petId/medical-record')
  findRecordByPet(@Param('petId') petId: string) {
    return this.medicalService.findRecordByPet(petId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'VET')
  @Get('medical-entries/:entryId')
  findEntry(@Param('entryId') entryId: string) {
    return this.medicalService.findEntry(entryId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VET')
  @Post('pets/:petId/medical-record/entries')
  addEntry(
    @Param('petId') petId: string,
    @Body() dto: CreateMedicalEntryDto,
    @Req() req: RequestWithUser,
  ) {
    return this.medicalService.addEntry(petId, req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VET')
  @Post('pets/:petId/medical-record/documents')
  @UseInterceptors(
    FileInterceptor('file', createMulterOptions(FileUploadCategory.DOCUMENT)),
  )
  uploadDocument(
    @Param('petId') petId: string,
    @Req() req: RequestWithUser,
    @UploadedFile(new ParseFilePipe({ fileIsRequired: true }))
    file: Express.Multer.File,
  ) {
    return this.medicalService.uploadMedicalDocument(
      petId,
      req.user.userId,
      file,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VET')
  @Patch('medical-entries/:entryId')
  updateEntry(
    @Param('entryId') entryId: string,
    @Body() dto: UpdateMedicalEntryDto,
  ) {
    return this.medicalService.updateEntry(entryId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VET')
  @Delete('medical-entries/:entryId')
  removeEntry(@Param('entryId') entryId: string) {
    return this.medicalService.removeEntry(entryId);
  }
}
