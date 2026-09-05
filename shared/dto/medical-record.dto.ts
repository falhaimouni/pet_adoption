import { IsDateString, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { MEDICAL_STATUS } from '../constants/medical-status.constants';

export class CreateMedicalEntryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  diagnosis!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  treatment!: string;

  @IsIn(Object.values(MEDICAL_STATUS))
  vaccinationStatus!: string;

  @IsDateString()
  medicalDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}

export class UpdateMedicalEntryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  diagnosis?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  treatment?: string;

  @IsOptional()
  @IsIn(Object.values(MEDICAL_STATUS))
  vaccinationStatus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}
