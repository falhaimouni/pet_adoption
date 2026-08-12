import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { rm } from 'fs/promises';
import { Repository } from 'typeorm';

import { FileUpload } from '../../database/entities/file-upload.entity';
import { FileUploadCategory } from '@shared/enums';
import {
  UPLOAD_DIRECTORIES,
  UPLOAD_ROOT,
} from '@shared/constants';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(
    @InjectRepository(FileUpload)
    private readonly fileRepo: Repository<FileUpload>,
  ) {}


  async createFileRecord(
    file: Express.Multer.File,
    category: FileUploadCategory,
    userId?: string,
  ) {

    //folder name is the same as category
    const folder = UPLOAD_DIRECTORIES[category];


    const fileUpload = this.fileRepo.create({
      fileName: file.filename,
      fileSize: file.size,
      mimeType: file.mimetype,

      category,

      //ex: /uploads/pets/83a7d2.png
      //for frontend to use it
      fileUrl:
        `/${UPLOAD_ROOT}/${folder}/${file.filename}`,

      uploadedBy: userId ?? null,
    });


    try {
      return await this.fileRepo.save(fileUpload);
    } catch (error) {
      await this.rollbackFileUpload(file.path);
      throw error;
    }
  }

  async rollbackFileUpload(
    filePath: string,
    fileId?: string,
  ): Promise<void> {
    if (fileId) {
      try {
        await this.fileRepo.delete(fileId);
      } catch (error) {
        this.logger.error(
          `Failed to remove FileUpload record ${fileId} during rollback`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    try {
      await rm(filePath, { force: true });
    } catch (error) {
      this.logger.error(
        `Failed to remove uploaded file ${filePath} during rollback`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
