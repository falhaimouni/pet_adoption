import { IsBoolean, IsEnum, IsIn, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength } from 'class-validator';
import { SUPPLY_CATEGORIES } from '../constants/supply-categories.constants';
import { SupplyStatusEnum } from '../enums';

export class CreateSupplyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  supplyName!: string;

  @IsIn(Object.values(SUPPLY_CATEGORIES))
  category!: string;

  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  quantity!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  sellingPrice!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  purchasePrice!: number;

  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  lowStockLimit!: number;

  @IsUUID()
  supplierId!: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  deliveryTimeDays?: number;

  @IsNumber({maxDecimalPlaces: 0})
  @Min(1)
  minimumOrderQuantity!: number;
  
  @IsOptional()
  @IsEnum(SupplyStatusEnum)
  status?: SupplyStatusEnum;

  @IsOptional()
  @IsBoolean()
  storeListed?: boolean;
}
export class UpdateSupplyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  supplyName?: string;

  @IsOptional()
  @IsIn(Object.values(SUPPLY_CATEGORIES))
  category?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  sellingPrice?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  purchasePrice?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  lowStockLimit?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  deliveryTimeDays?: number;

  @IsOptional()
  @IsNumber({maxDecimalPlaces: 0})
  @Min(1)
  minimumOrderQuantity?: number;

  @IsOptional()
  @IsEnum(SupplyStatusEnum)
  status?: SupplyStatusEnum;

  @IsOptional()
  @IsBoolean()
  storeListed?: boolean;
}
