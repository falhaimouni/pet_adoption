import { Type } from 'class-transformer';
import {
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
  @IsString()
  @MaxLength(80)
  species?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  breed?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
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
  @Validate(IsValidAgeRangeConstraint)
  maxAge?: number;
}
