//generate a unique filename
//only gets the extension from the original filename
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { FileUploadCategory } from '@shared/enums';
import { UPLOAD_DIRECTORIES } from '@shared/constants/uploads.constants';

export function generateFilename(
  file: Express.Multer.File,
): string {
  const extension = extname(file.originalname);

  return `${randomUUID()}${extension}`;
}

//convert category to the folder name
export function getUploadFolder(
  category: FileUploadCategory,
): string {
  return UPLOAD_DIRECTORIES[category] ?? 'others';
  //other is a fallback in case the category is not recognized, to avoid errors and ensure that files are still stored somewhere.
}