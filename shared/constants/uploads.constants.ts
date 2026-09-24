import { FileUploadCategory } from '../enums';

export const UPLOAD_ROOT = 'uploads';

export const UPLOAD_DIRECTORIES: Partial<Record<FileUploadCategory, string>> = {
  [FileUploadCategory.AVATAR]: 'avatars',
  [FileUploadCategory.PET_IMAGE]: 'pets',
  [FileUploadCategory.SUPPLY_IMAGE]: 'supplies',
  [FileUploadCategory.DOCUMENT]: 'documents',
};

export const UPLOAD_MAX_FILE_SIZES = {
  IMAGE: 5 * 1024 * 1024,
  DOCUMENT: 10 * 1024 * 1024,
} as const;

export interface UploadRule {
  mimeTypes: string[];
  extensions: string[];
  maxSize: number;
}

export const UPLOAD_MIME_EXTENSIONS: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'application/json': ['.json'],
  'text/json': ['.json'],
  'text/csv': ['.csv'],
  'application/csv': ['.csv'],
  'application/vnd.ms-excel': ['.csv'],
};

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export function isUploadMimeExtensionMatch(
  mimeType: string,
  extension: string,
): boolean {
  return UPLOAD_MIME_EXTENSIONS[mimeType]?.includes(extension) ?? false;
}

export const IMAGE_UPLOAD_RULE: UploadRule = {
  mimeTypes: IMAGE_MIME_TYPES,
  extensions: IMAGE_MIME_TYPES.flatMap(
    (mimeType) => UPLOAD_MIME_EXTENSIONS[mimeType],
  ),
  maxSize: UPLOAD_MAX_FILE_SIZES.IMAGE,
};

export const DOCUMENT_UPLOAD_RULE: UploadRule = {
  mimeTypes: ['application/pdf'],
  extensions: ['.pdf'],
  maxSize: UPLOAD_MAX_FILE_SIZES.DOCUMENT,
};

export const UPLOAD_RULES: Record<FileUploadCategory, UploadRule> = {
  [FileUploadCategory.AVATAR]: IMAGE_UPLOAD_RULE,
  [FileUploadCategory.PET_IMAGE]: IMAGE_UPLOAD_RULE,
  [FileUploadCategory.SUPPLY_IMAGE]: IMAGE_UPLOAD_RULE,
  [FileUploadCategory.DOCUMENT]: DOCUMENT_UPLOAD_RULE,
};