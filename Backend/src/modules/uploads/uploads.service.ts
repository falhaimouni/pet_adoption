import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { access, readFile, realpath, rm, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { isAbsolute, relative, resolve } from 'path';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { FileUpload } from '../../database/entities/file-upload.entity';
import { PetImage } from '../../database/entities/pet-image.entity';
import { Supply } from '../../database/entities/supply.entity';
import { User } from '../../database/entities/user.entity';
import { FileUploadCategory } from '@shared/enums';
import { UPLOAD_DIRECTORIES } from '@shared/constants';
import { RequestWithUser } from '@shared/types/auth.types';
import { validateUploadedFile } from './upload-validation.util';
import { resolveUploadRoot } from './upload-path.util';

export interface StoredFileBackup {
  fileId: string;
  filePath: string;
  contents: Buffer;
}

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(
    @InjectRepository(FileUpload)
    private readonly fileRepo: Repository<FileUpload>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}


  async createFileRecord(
    file: Express.Multer.File,
    category: FileUploadCategory,
    userId?: string,
    medicalRecordId?: string,
  ) {
    try {
      await validateUploadedFile(file, category);

      //folder name is the same as category
      const folder = UPLOAD_DIRECTORIES[category];
      const fileId = randomUUID();

      const fileUpload = this.fileRepo.create({
        fileId,
        fileName: file.filename,
        fileSize: file.size,
        mimeType: file.mimetype,
        category,
        medicalRecordId: medicalRecordId ?? null,
        fileUrl: this.getProtectedFileUrl(fileId),
        uploadedBy: userId ?? null,
      });

      return await this.fileRepo.save(fileUpload);
    } catch (error) {
      await this.rollbackFileUpload(file.path);
      throw error;
    }
  }

  async getFileForUser(
    fileId: string,
    user: RequestWithUser['user'],
  ) {
    const file = await this.fileRepo.findOne({ where: { fileId } });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    await this.authorizeRetrieval(file, user);
    const filePath = await this.resolveSafeStoredFilePath(file);

    return { file, filePath };
  }

  async deleteFile(
    fileId: string,
    user: RequestWithUser['user'],
  ): Promise<{ message: string }> {
    const file = await this.fileRepo.findOne({ where: { fileId } });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    await this.dataSource.transaction(async (manager) => {
      await this.authorizeDeletion(manager, file, user);
    });

    await this.deleteStoredFile(file);
    return { message: 'File deleted successfully' };
  }

  async deleteReplacementFile(fileId: string): Promise<void> {
    const file = await this.fileRepo.findOne({ where: { fileId } });

    if (file) {
      await this.deleteStoredFile(file);
    }
  }

  async findFileByUrl(fileUrl: string): Promise<FileUpload | null> {
    return this.fileRepo.findOne({
      where: {
        fileUrl,
        category: FileUploadCategory.AVATAR,
      },
    });
  }

  private async deleteStoredFile(file: FileUpload): Promise<void> {
    const backup = await this.removePhysicalFile(file);

    try {
      await this.dataSource.transaction(async (manager) => {
        await this.clearReferences(manager, file);
        await manager.getRepository(FileUpload).delete(file.fileId);
      });
    } catch (error) {
      try {
        await this.restorePhysicalFile(backup);
      } catch (restoreError) {
        this.logger.error(
          `Failed to restore deleted file ${file.fileId} after database deletion failure`,
          restoreError instanceof Error ? restoreError.stack : undefined,
        );
      }
      throw error;
    }

  }

  private resolveStoredFilePath(file: FileUpload): string {
    const folder = UPLOAD_DIRECTORIES[file.category];

    if (!folder) {
      throw new NotFoundException('File storage location not found');
    }

    const uploadRoot = resolve(resolveUploadRoot());
    const filePath = resolve(uploadRoot, folder, file.fileName);
    const categoryRoot = resolve(uploadRoot, folder);
    const relativeFilePath = relative(categoryRoot, filePath);

    if (isAbsolute(relativeFilePath) || relativeFilePath.startsWith('..')) {
      throw new NotFoundException('File not found');
    }

    return filePath;
  }

  getProtectedFileUrl(fileId: string): string {
    return `/files/${fileId}`;
  }

  getFileReference(file: Pick<FileUpload, 'fileId' | 'fileUrl'>): string {
    return /^https?:\/\//i.test(file.fileUrl)
      ? file.fileUrl
      : this.getProtectedFileUrl(file.fileId);
  }

  async removePhysicalFile(file: FileUpload): Promise<StoredFileBackup> {
    const filePath = await this.resolveSafeStoredFilePath(file);
    const contents = await this.readStoredFile(filePath);

    await rm(filePath, { force: false });

    return {
      fileId: file.fileId,
      filePath,
      contents,
    };
  }

  async restorePhysicalFile(backup: StoredFileBackup): Promise<void> {
    try {
      await writeFile(backup.filePath, backup.contents, { flag: 'wx' });
    } catch (error) {
      this.logger.error(
        `Failed to restore deleted file ${backup.fileId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async resolveSafeStoredFilePath(file: FileUpload): Promise<string> {
    const filePath = this.resolveStoredFilePath(file);
    const folder = UPLOAD_DIRECTORIES[file.category];

    if (!folder) {
      throw new NotFoundException('File storage location not found');
    }

    try {
      const realFilePath = await realpath(filePath);
      const realCategoryRoot = await realpath(
        resolve(resolveUploadRoot(), folder),
      );
      const relativeFilePath = relative(realCategoryRoot, realFilePath);

      if (isAbsolute(relativeFilePath) || relativeFilePath.startsWith('..')) {
        throw new NotFoundException('File not found');
      }

      return realFilePath;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Stored file not found');
    }
  }

  private async readStoredFile(filePath: string): Promise<Buffer> {
    try {
      await access(filePath);
      return await readFile(filePath);
    } catch {
      throw new NotFoundException('Stored file not found');
    }
  }

  private async authorizeRetrieval(
    file: FileUpload,
    user: RequestWithUser['user'],
  ): Promise<void> {
    if (file.category === FileUploadCategory.DOCUMENT) {
      if (!['ADMIN', 'MANAGER', 'VET'].includes(user.role)) {
        throw new ForbiddenException('You are not allowed to access this file');
      }
      return;
    }

    if (file.category === FileUploadCategory.AVATAR) {
      if (/^https?:\/\//i.test(file.fileUrl)) {
        throw new ForbiddenException('External avatar URLs are not managed files');
      }

      const owner = await this.fileRepo.manager.getRepository(User).findOne({
        where: { avatar: file.fileUrl },
        relations: ['role'],
      });

      if (!owner) {
        throw new ForbiddenException('You are not allowed to access this file');
      }

      const managedByCurrentUser =
        ['ADMIN', 'MANAGER'].includes(user.role) &&
        this.isHigherRole(user.role, owner.role.roleName);

      if (owner.userId !== user.userId && !managedByCurrentUser) {
        throw new ForbiddenException('You are not allowed to access this file');
      }
      return;
    }

    if (
      file.category === FileUploadCategory.PET_IMAGE ||
      file.category === FileUploadCategory.SUPPLY_IMAGE
    ) {
      return;
    }

    throw new ForbiddenException('You are not allowed to access this file');
  }

  private async authorizeDeletion(
    manager: EntityManager,
    file: FileUpload,
    user: RequestWithUser['user'],
  ): Promise<void> {
    if (file.category === FileUploadCategory.DOCUMENT) {
      if (!['ADMIN', 'MANAGER', 'VET'].includes(user.role)) {
        throw new ForbiddenException('You are not allowed to delete this file');
      }
      return;
    }

    if (
      file.category === FileUploadCategory.PET_IMAGE ||
      file.category === FileUploadCategory.SUPPLY_IMAGE
    ) {
      if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(user.role)) {
        throw new ForbiddenException('You are not allowed to delete this file');
      }
      return;
    }

    if (file.category !== FileUploadCategory.AVATAR) {
      throw new ForbiddenException('You are not allowed to delete this file');
    }

    if (/^https?:\/\//i.test(file.fileUrl)) {
      throw new ForbiddenException('External avatar URLs are not managed files');
    }

    const avatarOwners = await manager.getRepository(User).find({
      where: { avatar: file.fileUrl },
      relations: ['role'],
    });

    if (avatarOwners.length !== 1) {
      throw new ForbiddenException('The avatar file is not safely associated with a user');
    }

    const avatarOwner = avatarOwners[0];
    const ownerRole = avatarOwner.role.roleName;
    const managedByCurrentUser =
      ['ADMIN', 'MANAGER'].includes(user.role) &&
      this.isHigherRole(user.role, ownerRole);

    if (avatarOwner.userId !== user.userId && !managedByCurrentUser) {
      throw new ForbiddenException('You are not allowed to delete this avatar');
    }

  }

  private async clearReferences(
    manager: EntityManager,
    file: FileUpload,
  ): Promise<void> {
    if (file.category === FileUploadCategory.PET_IMAGE) {
      await manager.getRepository(PetImage).delete({ fileId: file.fileId });
      return;
    }

    if (file.category === FileUploadCategory.SUPPLY_IMAGE) {
      await manager.getRepository(Supply).update(
        { imageFileId: file.fileId },
        { imageFileId: null },
      );
      return;
    }

    if (file.category === FileUploadCategory.AVATAR) {
      await manager.getRepository(User).update(
        { avatar: file.fileUrl },
        { avatar: null },
      );
    }
  }

  private isHigherRole(currentRole: string, targetRole: string): boolean {
    const roleRanks: Record<string, number> = {
      ADMIN: 4,
      MANAGER: 3,
      EMPLOYEE: 2,
      VET: 2,
      ADOPTER: 1,
    };

    return (roleRanks[currentRole] ?? 0) > (roleRanks[targetRole] ?? 0);
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
