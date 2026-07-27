import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';

import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

import { UploadsService } from './uploads.service';

import { multerOptions } from './multer.config';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { FileUploadCategory } from '@shared/enums';

type AuthenticatedRequest = Request & {
  user: {
    userId: string;
  };
};

@Controller('uploads')
export class UploadsController {

  constructor(
    private readonly uploadsService: UploadsService,
  ) {}


  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor(
        //same name as in the frontend
      'file',
      //config for multer
      multerOptions,
    ),
  )
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('category') category: FileUploadCategory,
    //take the userId
    @Req() req: AuthenticatedRequest,
  ) {

    //takes the file, category, and userId and creates a record in the database
    return this.uploadsService.createFileRecord(
      file,
      category,
      req.user.userId,
    );
  }
}