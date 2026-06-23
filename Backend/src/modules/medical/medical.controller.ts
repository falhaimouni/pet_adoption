import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  CreateMedicalEntryDto,
  UpdateMedicalEntryDto,
} from '@shared/dto/medical-record.dto';
import { RequestWithUser } from '@shared/types/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';
import { MedicalService } from './medical.service';

@Controller()
export class MedicalController {
  constructor(private readonly medicalService: MedicalService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE', 'VET')
  @Get('pets/:petId/medical-record')
  findRecordByPet(@Param('petId') petId: string) {
    return this.medicalService.findRecordByPet(petId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE', 'VET')
  @Get('pets/:petId/medical-record/entries')
  findEntriesByPet(@Param('petId') petId: string) {
    return this.medicalService.findEntriesByPet(petId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'VET')
  @Post('pets/:petId/medical-record/entries')
  addEntry(
    @Param('petId') petId: string,
    @Body() dto: CreateMedicalEntryDto,
    @Req() req: RequestWithUser,
  ) {
    return this.medicalService.addEntry(petId, req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'VET')
  @Patch('medical-entries/:entryId')
  updateEntry(
    @Param('entryId') entryId: string,
    @Body() dto: UpdateMedicalEntryDto,
  ) {
    return this.medicalService.updateEntry(entryId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'VET')
  @Delete('medical-entries/:entryId')
  removeEntry(@Param('entryId') entryId: string) {
    return this.medicalService.removeEntry(entryId);
  }
}
