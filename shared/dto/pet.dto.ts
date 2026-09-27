import { Transform } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Matches, MaxLength, Min, MinLength } from 'class-validator';
import { normalizePetStatus, PET_STATUS } from '../constants/pet-status.constants';
import { PET_GENDER, PET_HEALTH_STATUS } from '../constants/pet-profile.constants';
import { PET_SPECIES } from '../constants/pet-species.constants';

const PET_TEXT_PATTERN = /^(?=.*\p{L})[\p{L}\p{M}\s.'&,/-]+$/u;

export class CreatePetDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Matches(PET_TEXT_PATTERN)
  name!: string;

  @IsIn(Object.values(PET_SPECIES))
  species!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Matches(PET_TEXT_PATTERN)
  breed?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  age?: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @IsIn(Object.values(PET_GENDER))
  gender?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Matches(PET_TEXT_PATTERN)
  color?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

}

export class UpdatePetDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Matches(PET_TEXT_PATTERN)
  name?: string;

  @IsOptional()
  @IsIn(Object.values(PET_SPECIES))
  species?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Matches(PET_TEXT_PATTERN)
  breed?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  age?: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @IsIn(Object.values(PET_GENDER))
  gender?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Matches(PET_TEXT_PATTERN)
  color?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @Transform(({ value }) => normalizePetStatus(value))
  @IsIn(Object.values(PET_STATUS))
  adoptionStatus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @IsIn(Object.values(PET_HEALTH_STATUS))
  healthStatus?: string;
}
