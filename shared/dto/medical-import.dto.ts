import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { MEDICAL_STATUS } from '../constants/medical-status.constants';

export class MedicalImportRowDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  petId?: string;

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
  @IsDateString()
  medicalDate?: string;

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
  @IsString()
  @MaxLength(120)
  batch?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  veterinarianId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}
