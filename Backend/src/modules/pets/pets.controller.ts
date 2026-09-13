import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { CreatePetDto, UpdatePetDto } from '@shared/dto/pet.dto';
import { FindPetsQueryDto } from '@shared/dto/find-pets-query.dto';
import { FileUploadCategory } from '@shared/enums';
import { RequestWithUser } from '@shared/types/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';
import { createMulterOptions } from '../uploads/multer.config';
import { PetsService } from './pets.service';

@Controller('pets')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Get()
  findAll(@Query() query: FindPetsQueryDto) {
    return this.petsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.petsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE', 'VET')
  @Get(':id/full')
  findFull(@Param('id') id: string) {
    return this.petsService.findFull(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Post()
  create(@Body() dto: CreatePetDto, @Req() req: RequestWithUser) {
    return this.petsService.create(dto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Post(':petId/images')
  @UseInterceptors(
    FileInterceptor(
      'file',
      createMulterOptions(FileUploadCategory.PET_IMAGE),
    ),
  )
  uploadImage(
    @Param('petId') petId: string,
    @Req() req: RequestWithUser,
    @UploadedFile(new ParseFilePipe({ fileIsRequired: true }))
    file: Express.Multer.File,
  ) {
    return this.petsService.uploadPetImage(
      petId,
      req.user.userId,
      file,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePetDto) {
    return this.petsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.petsService.remove(id);
  }
}
