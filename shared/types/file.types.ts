import { FileUploadCategory } from '../enums';

export interface FileUpload {
  fileId: string;
  uploadedBy: string | null;
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
  fileSize: number;
  category: FileUploadCategory;
  medicalRecordId: string | null;
  uploadedAt: string;
}
