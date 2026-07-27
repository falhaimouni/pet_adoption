import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';

import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

import { FileUpload } from '../../database/entities/file-upload.entity';
import { multerOptions } from './multer.config';


@Module({
    //makes the repo available for injection in the service
  imports: [
    TypeOrmModule.forFeature([FileUpload]),

    //connect multer settings
    MulterModule.register(
      multerOptions,
    ),
  ],

  controllers: [
    UploadsController,
  ],

  providers: [
    UploadsService,
  ],

  exports: [
    UploadsService,
  ],
})
export class UploadsModule {}