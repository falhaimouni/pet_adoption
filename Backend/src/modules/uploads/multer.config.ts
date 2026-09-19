//for file name, where to store
import { diskStorage } from 'multer';
import { mkdirSync, existsSync, lstatSync, realpathSync } from 'fs';
import { isAbsolute, join, relative, resolve } from 'path';
import { resolveUploadRoot } from './upload-path.util';
import { fileFilter } from './file-filter';
import { generateFilename } from './filename.util';

import {
    UPLOAD_DIRECTORIES,
    UPLOAD_ROOT,
  UPLOAD_RULES,
} from '@shared/constants/uploads.constants';

import { FileUploadCategory } from '@shared/enums';

export function createMulterOptions(
  category: FileUploadCategory,
) {
  return {
    storage: diskStorage({
      destination: (req, file, callback) => {

        const folder = UPLOAD_DIRECTORIES[category];

        if (!folder) {
          return callback(new Error('No upload directory is configured for this category'), '');
        }

        const uploadPath = join(
          resolveUploadRoot(),
          folder,
        );

        //checks if the folder exists, if not create it recursively
        if (!existsSync(uploadPath)) {
          mkdirSync(uploadPath, { recursive: true });
        }

        const realUploadRoot = realpathSync(resolve(resolveUploadRoot()));
        const realUploadPath = realpathSync(uploadPath);
        const relativeUploadPath = relative(realUploadRoot, realUploadPath);

        if (
          isAbsolute(relativeUploadPath) ||
          relativeUploadPath.startsWith('..')
        ) {
          return callback(new Error('Invalid upload storage path'), '');
        }

        callback(null, uploadPath);
      },

      filename: (req, file, callback) => {
        const filename = generateFilename(file);
        const folder = UPLOAD_DIRECTORIES[category];

        if (!folder) {
          return callback(new Error('No upload directory is configured for this category'), '');
        }

        const targetPath = join(resolveUploadRoot(), folder, filename);

        try {
          if (existsSync(targetPath) || lstatSync(targetPath, { throwIfNoEntry: false })) {
            return callback(new Error('Upload target already exists'), '');
          }
        } catch {
          return callback(new Error('Invalid upload target'), '');
        }

        callback(null, filename);
      },
    }),

    //for file validation, checks if the file type and extension match the category
    fileFilter: fileFilter.bind(null, category),

    //5MB for images, 10MB for documents
    limits: {
      fileSize: UPLOAD_RULES[category].maxSize,
    },
  };
}