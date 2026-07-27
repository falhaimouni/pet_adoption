//for file name, where to store
import { diskStorage } from 'multer';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { resolveUploadRoot } from './upload-path.util';
import { fileFilter } from './file-filter';
import { generateFilename } from './filename.util';

import {
    UPLOAD_DIRECTORIES,
    UPLOAD_ROOT,
} from '@shared/constants/uploads.constants';

import { FileUploadCategory } from '@shared/enums';

export const multerOptions = {
  storage: diskStorage({
    destination: (req, file, callback) => {
      const category = req.body.category as FileUploadCategory;

      const folder =
        UPLOAD_DIRECTORIES[category] ?? 'others';

      const uploadPath = join(
        resolveUploadRoot(),
        folder,
      );

      //checks if the folder exists, if not create it recursively
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
      }

      callback(null, uploadPath);
    },

    filename: (req, file, callback) => {
      callback(
        null,
        generateFilename(file),
      );
    },
  }),

  //for the extensions
  fileFilter,

  //5MB
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
};