//generate filename based on the file mimetype and a random uuid
import { randomUUID } from 'crypto';

export function generateFilename(
  file: Express.Multer.File,
): string {
  const extensionsByMimeType: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
  };
  const extension = extensionsByMimeType[file.mimetype];

  if (!extension) {
    throw new Error('Unsupported upload MIME type');
  }

  return `${randomUUID()}${extension}`;
}