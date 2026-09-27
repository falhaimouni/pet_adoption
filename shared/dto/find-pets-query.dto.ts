import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Max,
  Min,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { PET_SPECIES } from '../constants/pet-species.constants';
import { normalizePetStatus, PET_STATUS } from '../constants/pet-status.constants';

export const PET_SORT_FIELDS = [
  'createdAt',
  'name',
  'species',
  'breed',
  'age',
  'status',
] as const;

export const SORT_ORDERS = ['ASC', 'DESC'] as const;

@ValidatorConstraint({ name: 'isValidAgeRange', async: false })
export class IsValidAgeRangeConstraint
  implements ValidatorConstraintInterface
{
  validate(maxAge: number | undefined, args: ValidationArguments): boolean {
    const object = args.object as FindPetsQueryDto;

    if (maxAge === undefined || object.minAge === undefined) {
      return true;
    }

    return maxAge >= object.minAge;
  }

  defaultMessage(): string {
    return 'maxAge must be greater than or equal to minAge';
  }
}
export class FindPetsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(Object.values(PET_SPECIES), { each: true })
  species?: string | string[];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  breed?: string;

  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((item) => normalizePetStatus(item))
      : normalizePetStatus(value),
  )
  @IsIn(Object.values(PET_STATUS), { each: true })
  status?: string | string[];

  @IsOptional()
  @IsString()
  @MaxLength(80)
  health?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minAge?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Validate(IsValidAgeRangeConstraint)
  maxAge?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 12;

  @IsOptional()
  @IsIn(PET_SORT_FIELDS)
  sortBy?: (typeof PET_SORT_FIELDS)[number] = 'createdAt';

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsIn(SORT_ORDERS)
  order?: (typeof SORT_ORDERS)[number] = 'DESC';
}
