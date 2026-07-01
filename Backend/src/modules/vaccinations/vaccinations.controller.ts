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
  CreateVaccinationDto,
  UpdateVaccinationDto,
} from '@shared/dto/vaccination.dto';
import { RequestWithUser } from '@shared/types/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';
import { VaccinationsService } from './vaccinations.service';

@Controller()
export class VaccinationsController {
  constructor(private readonly vaccinationsService: VaccinationsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE', 'VET')
  @Get('pets/:petId/vaccinations')
  findByPet(@Param('petId') petId: string) {
    return this.vaccinationsService.findByPet(petId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VET')
  @Post('pets/:petId/vaccinations')
  create(
    @Param('petId') petId: string,
    @Body() dto: CreateVaccinationDto,
    @Req() req: RequestWithUser,
  ) {
    return this.vaccinationsService.create(petId, req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VET')
  @Patch('vaccinations/:vaccinationId')
  update(
    @Param('vaccinationId') vaccinationId: string,
    @Body() dto: UpdateVaccinationDto,
  ) {
    return this.vaccinationsService.update(vaccinationId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VET')
  @Delete('vaccinations/:vaccinationId')
  remove(@Param('vaccinationId') vaccinationId: string) {
    return this.vaccinationsService.remove(vaccinationId);
  }
}
