import { IsIn, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { SUPPLY_CATEGORIES } from '../constants/supply-categories.constants';

export class CreateSupplyDto {
  @IsString()
  @Min(1)
  @MaxLength(160)
  supplyName!: string;

  @IsIn(Object.values(SUPPLY_CATEGORIES))
  category!: string;

  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  quantity!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice!: number;

  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  lowStockLimit!: number;

  @IsString()
  supplierId!: string;

  @IsNumber({maxDecimalPlaces:2})
  @Min(0)
  supplyPrice!: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  deliveryTime?: string

  @IsNumber({maxDecimalPlaces: 0})
  @Min(1)
  minimumOrderQuantity!: number;
  
}

export class UpdateSupplyDto {
  @IsOptional()
  @IsString()
  @Min(1)
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
  unitPrice?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  lowStockLimit?: number;
}
