//decides whether the uploaded file is allowed
import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { extname } from 'path';

import { FileUploadCategory } from '@shared/enums';
import {
  isUploadMimeExtensionMatch,
  UploadRule,
  UPLOAD_RULES,
} from '@shared/constants';

export function fileFilter(
  category: FileUploadCategory,
  rule: UploadRule = UPLOAD_RULES[category],
  req: Request,
  file: Express.Multer.File,
  //a function that is called later
  //error,false means reject/ null,true means continue uploading
  callback: (
    error: Error | null,
    acceptFile: boolean,
  ) => void,
) {
  //extension is the part after the file name
  const extension = extname(file.originalname).toLowerCase();
  //mime is the type of the file
  const mimeTypeSupported = rule.mimeTypes.includes(file.mimetype);
  const extensionSupported = rule.extensions.includes(extension);
  //checks if the file type and extension match
  const matchingType = isUploadMimeExtensionMatch(file.mimetype, extension);

  if (!mimeTypeSupported || !extensionSupported || !matchingType) {
    return callback(
      new BadRequestException(
        'The uploaded file type or extension is not supported for this category.',
      ),
      false,
    );
  }

  callback(null, true);
}