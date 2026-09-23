import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { MessageType } from '../enums/message-type.enum';

export class SendMessageDto {
  @ValidateIf((dto: SendMessageDto) => dto.type === MessageType.TEXT)
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(5000)
  messageText?: string;

  @IsIn([
    MessageType.TEXT,
    MessageType.IMAGE,
    MessageType.VIDEO,
    MessageType.AUDIO,
    MessageType.FILE,
  ])
  type!: MessageType;

  @ValidateIf((dto: SendMessageDto) => dto.type !== MessageType.TEXT)
  @IsString()
  @IsNotEmpty()
  @Matches(/^(?:https?:\/\/[^\s]+|\/files\/[0-9a-f-]{36})$/i)
  fileUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  caption?: string;
}
