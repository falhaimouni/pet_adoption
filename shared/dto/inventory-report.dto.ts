import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

import { SupplyStatusEnum } from '@shared/enums';

const INVENTORY_REPORT_STATUSES = [
  'OK',
  'LOW_STOCK',
  SupplyStatusEnum.OUT_OF_STOCK,
] as const;

export class InventoryReportQueryDto {
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsIn(INVENTORY_REPORT_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  supplier?: string;
}
