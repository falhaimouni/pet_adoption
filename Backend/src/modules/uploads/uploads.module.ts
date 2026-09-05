import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UploadsService } from './uploads.service';

import { FileUpload } from '../../database/entities/file-upload.entity';


@Module({

  imports: [
    TypeOrmModule.forFeature([
      FileUpload,
    ]),
  ],


  providers: [
    UploadsService,
  ],


  exports: [
    UploadsService,
  ],

})
export class UploadsModule {}