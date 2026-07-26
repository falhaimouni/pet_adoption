//decides whether the uploaded file is allowed
import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';

export function fileFilter(
  req: Request,
  file: Express.Multer.File,
  //a function that is called later
  //error,false means reject/ null,true means continue uploading
  callback: (
    error: Error | null,
    acceptFile: boolean,
  ) => void,
) {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return callback(
      new BadRequestException(
        'Only JPG, PNG and WEBP images are allowed.',
      ),
      false,
    );
  }

  callback(null, true);
}