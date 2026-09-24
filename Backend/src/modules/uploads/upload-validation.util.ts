import { BadRequestException } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { extname } from 'path';

import { FileUploadCategory } from '@shared/enums';
import {
  isUploadMimeExtensionMatch,
  UploadRule,
  UPLOAD_RULES,
} from '@shared/constants';

//every file type has a unique signature, which is a sequence of bytes at the beginning of the file that identifies its format
function hasSignature(content: Buffer, mimeType: string): boolean {
  if (mimeType === 'image/jpeg') {
    return content.length >= 3 && content.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  }

  if (mimeType === 'image/png') {
    return content.length >= 8 && content.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  }

  if (mimeType === 'image/webp') {
    return content.length >= 12 &&
      content.subarray(0, 4).toString('ascii') === 'RIFF' &&
      content.subarray(8, 12).toString('ascii') === 'WEBP';
  }

  if (mimeType === 'application/pdf') {
    return content.length >= 5 && content.subarray(0, 5).toString('ascii') === '%PDF-';
  }

  if (mimeType === 'application/json' || mimeType === 'text/json') {
    const text = content.toString('utf8').trimStart();
    return text.startsWith('{') || text.startsWith('[');
  }

  if (
    mimeType === 'text/csv' ||
    mimeType === 'application/csv' ||
    mimeType === 'application/vnd.ms-excel'
  ) {
    const text = content.toString('utf8').trim();
    return text.length > 0 && /[\n\r,]/.test(text.slice(0, 200));
  }

  return false;
}

export async function validateUploadedFile(
  file: Express.Multer.File,
  category: FileUploadCategory,
  rule: UploadRule = UPLOAD_RULES[category],
): Promise<void> {
  const extension = extname(file.originalname).toLowerCase();
  const matchingType = isUploadMimeExtensionMatch(file.mimetype, extension);

  if (
    file.size > rule.maxSize ||
    !rule.mimeTypes.includes(file.mimetype) ||
    !rule.extensions.includes(extension) ||
    !matchingType
  ) {
    throw new BadRequestException('The uploaded file failed validation.');
  }

  const content = await readFile(file.path);

  if (!hasSignature(content, file.mimetype)) {
    throw new BadRequestException('The uploaded file content does not match its declared type.');
  }
}