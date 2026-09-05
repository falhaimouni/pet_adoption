import { IsEnum, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { NotificationTypeEnum } from '../enums/notification.enum';

export class CreateNotificationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  message!: string;

  @IsEnum(NotificationTypeEnum)
  type!: NotificationTypeEnum;
}