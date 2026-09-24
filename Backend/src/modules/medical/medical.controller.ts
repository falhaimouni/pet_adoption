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
  UploadedFiles,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
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

import { MAX_BULK_DOCUMENTS } from '@shared/dto/bulk-documents.dto';

@Controller()
export class MedicalController {
  constructor(private readonly medicalService: MedicalService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'VET')
  @Post('pets/:petId/medical-record/import/bulk')
  @UseInterceptors(
    FilesInterceptor('files', MAX_BULK_DOCUMENTS, createMulterOptions(FileUploadCategory.DOCUMENT)),
  )
  importDocuments(
    @Param('petId') petId: string,
    @Req() req: RequestWithUser,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.medicalService.importMedicalDocuments(petId, req.user.userId, files);
  }

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
  @Roles('ADMIN', 'MANAGER', 'VET')
  @Post('pets/:petId/medical-record/import')
  @UseInterceptors(
    FileInterceptor('file', createMulterOptions(FileUploadCategory.DOCUMENT)),
  )
  importMedicalData(
    @Param('petId') petId: string,
    @Req() req: RequestWithUser,
    @UploadedFile(new ParseFilePipe({ fileIsRequired: true }))
    file: Express.Multer.File,
  ) {
    return this.medicalService.importMedicalData(petId, req.user.userId, file);
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
