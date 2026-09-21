import { IsEnum, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { MessageType } from '../enums/message-type.enum';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(5000)
  messageText!: string;

  @IsEnum(MessageType)
  type!: MessageType;
}