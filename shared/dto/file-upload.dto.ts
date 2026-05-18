export interface FileUploadDto {
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface FileUploadResponseDto {
  id: string;
  fileUrl: string;
  fileName: string;
  uploadedAt: string;
}
