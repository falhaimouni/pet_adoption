import { FileUploadCategory } from '../enums';

export const UPLOAD_ROOT = 'uploads';

export const UPLOAD_DIRECTORIES: Record<FileUploadCategory, string> = {
  [FileUploadCategory.AVATAR]: 'avatars',
  [FileUploadCategory.PET_IMAGE]: 'pets',
  [FileUploadCategory.SUPPLY_IMAGE]: 'supplies',
};