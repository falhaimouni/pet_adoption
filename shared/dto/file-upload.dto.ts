import { IsInt, IsString, MaxLength, Min } from 'class-validator';

export class FileUploadDto {
  @IsString()
  @MaxLength(255)
  fileName!: string;

  @IsString()
  @MaxLength(120)
  fileType!: string;

  @IsInt()
  @Min(1)
  fileSize!: number;
}

export interface FileUploadResponseDto {
  id: string;
  fileUrl: string;
  fileName: string;
  uploadedAt: string;
}
