import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { VaccineStatusEnum } from '../enums/vaccine-status.enum';

export class CreateVaccinationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  vaccineName!: string;

  @IsDateString()
  vaccinationDate!: string;

  @IsOptional()
  @IsDateString()
  nextDueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}

export class UpdateVaccinationDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  vaccineName?: string;

  @IsOptional()
  @IsDateString()
  vaccinationDate?: string;

  @IsOptional()
  @IsDateString()
  nextDueDate?: string;

  @IsOptional()
  @IsEnum(VaccineStatusEnum)
  status?: VaccineStatusEnum;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}
