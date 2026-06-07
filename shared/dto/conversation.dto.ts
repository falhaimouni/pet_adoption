import { IsIn, IsOptional, IsUUID } from 'class-validator';

const CONVERSATION_STATUSES = ['ACTIVE', 'CLOSED', 'PENDING', 'ARCHIVED'] as const;

export class CreateConversationDto {
  @IsOptional()
  @IsUUID()
  assignedEmployeeId?: string;
}

export class UpdateConversationDto {
  @IsOptional()
  @IsIn(CONVERSATION_STATUSES)
  status?: (typeof CONVERSATION_STATUSES)[number];

  @IsOptional()
  @IsUUID()
  assignedEmployeeId?: string;
}
