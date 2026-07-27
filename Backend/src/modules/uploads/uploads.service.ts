import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FileUpload } from '../../database/entities/file-upload.entity';
import { FileUploadCategory } from '@shared/enums';
import { UPLOAD_DIRECTORIES, UPLOAD_ROOT } from '@shared/constants';

@Injectable()
export class UploadsService {
  constructor(
    @InjectRepository(FileUpload)
    private readonly fileRepo: Repository<FileUpload>,
  ) {}


  async createFileRecord(
    file: Express.Multer.File,
    category: FileUploadCategory,
    userId?: string,
  ) {

    const folder = UPLOAD_DIRECTORIES[category] ?? 'others';

    const fileUpload = this.fileRepo.create({
      fileName: file.filename,
      fileSize: file.size,
      mimeType: file.mimetype,
      category,
      //ex: /uploads/pets/83a7d2.png
      //for frontend to use it
      fileUrl: `/${UPLOAD_ROOT}/${folder}/${file.filename}`,
      uploadedBy: userId ?? null,
    });


    return this.fileRepo.save(fileUpload);
  }
}