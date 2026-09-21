import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  Max,
  Min,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isValidActivityDateRange', async: false })
export class IsValidActivityDateRangeConstraint
  implements ValidatorConstraintInterface
{
  validate(to: string | undefined, args: ValidationArguments): boolean {
    const query = args.object as UserActivityAnalyticsQueryDto;
    return !to || !query.from || new Date(to) >= new Date(query.from);
  }

  defaultMessage(): string {
    return 'to must be greater than or equal to from';
  }
}

export class UserActivityAnalyticsQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  @Validate(IsValidActivityDateRangeConstraint)
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;
}

export interface UserActivityTrendDto {
  date: string;
  count: number;
  uniqueUsers: number;
}

export interface UserActivityBreakdownDto {
  name: string;
  count: number;
}

export interface UserActivityTopUserDto {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  activityCount: number;
}

export interface UserActivityAnalyticsDto {
  filters: {
    from: string;
    to: string;
    limit: number;
  };
  summary: {
    totalActivities: number;
    uniqueActiveUsers: number;
    averageActivitiesPerActiveUser: number;
  };
  trend: UserActivityTrendDto[];
  actions: UserActivityBreakdownDto[];
  entities: UserActivityBreakdownDto[];
  topUsers: UserActivityTopUserDto[];
}