import { IsOptional, IsString, IsIn } from 'class-validator';
import { FileUploadCategory } from '../enums/file-upload-category.enum';

export class UploadFileDto {
  @IsOptional()
  @IsString()
  @IsIn(Object.values(FileUploadCategory))
  category?: FileUploadCategory;
}