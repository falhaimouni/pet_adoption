//generate a unique filename
//only gets the extension from the original filename
import { extname } from 'path';
import { randomUUID } from 'crypto';

export function generateFilename(
  file: Express.Multer.File,
): string {
  const extension = extname(file.originalname);

  return `${randomUUID()}${extension}`;
}