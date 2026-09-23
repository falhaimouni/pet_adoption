import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";
export class CommunityMessageDto {
  @IsOptional() @IsString() @MaxLength(4000) text?: string;
  @IsOptional() @IsUUID() replyTo?: string;
}
export class TargetUserDto {
  @IsUUID() userId!: string;
}
export class RequestActionDto {
  @IsIn(["accept", "reject", "cancel"]) action!: "accept" | "reject" | "cancel";
}
export class DirectMessageDto {
  @IsString() @MinLength(1) @MaxLength(4000) text!: string;
}
export class TimelineDto {
  @IsOptional() @IsUUID() before?: string;
}

export class AdopterSearchDto {
  @IsString() @MaxLength(100) name!: string;
}
