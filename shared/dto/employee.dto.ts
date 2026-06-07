import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength } from 'class-validator';

export class CreateEmployeeDto {
  @IsUUID()
  departmentId!: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  salary?: number;

  @IsDateString()
  hireDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  address?: string;
}

export class UpdateEmployeeDto {
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  salary?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  address?: string;
}
