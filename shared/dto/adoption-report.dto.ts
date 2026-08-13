import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { AdoptionStatusEnum } from '@shared/enums';

const ADOPTION_STATUSES = [
  ...Object.values(AdoptionStatusEnum),
  'CANCELLED',
] as const;

@ValidatorConstraint({ name: 'isValidReportDateRange', async: false })
export class IsValidReportDateRangeConstraint
  implements ValidatorConstraintInterface
{
  validate(to: string | undefined, args: ValidationArguments): boolean {
    const object = args.object as AdoptionReportQueryDto;

    if (!to || !object.from) {
      return true;
    }

    return new Date(to) >= new Date(object.from);
  }

  defaultMessage(): string {
    return 'to must be greater than or equal to from';
  }
}

export class AdoptionReportQueryDto {
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsIn(ADOPTION_STATUSES)
  status?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  @Validate(IsValidReportDateRangeConstraint)
  to?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  species?: string;
}
