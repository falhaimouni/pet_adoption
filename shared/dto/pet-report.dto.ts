import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { PetStatusEnum } from '@shared/enums';

@ValidatorConstraint({ name: 'isValidPetReportAgeRange', async: false })
export class IsValidPetReportAgeRangeConstraint
  implements ValidatorConstraintInterface
{
  validate(maxAge: number | undefined, args: ValidationArguments): boolean {
    const object = args.object as PetReportQueryDto;

    if (maxAge === undefined || object.minAge === undefined) {
      return true;
    }

    return maxAge >= object.minAge;
  }

  defaultMessage(): string {
    return 'maxAge must be greater than or equal to minAge';
  }
}

export class PetReportQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  species?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsIn(Object.values(PetStatusEnum))
  status?: string;

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
  @Validate(IsValidPetReportAgeRangeConstraint)
  maxAge?: number;
}
