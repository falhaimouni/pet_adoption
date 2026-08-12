import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  supplierName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(30)
  phone?: string;

  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  address?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  city?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  country? : string;
}

export class UpdateSupplierDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  supplierName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  address?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  country?: string;
}
