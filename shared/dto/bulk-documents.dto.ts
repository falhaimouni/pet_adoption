import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsUUID } from 'class-validator';

export const MAX_BULK_DOCUMENTS = 20;

export class BulkDeleteDocumentsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BULK_DOCUMENTS)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  fileIds!: string[];
}
