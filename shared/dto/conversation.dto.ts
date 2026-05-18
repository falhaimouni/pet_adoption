export interface CreateConversationDto {
  adopterId: string;
  assignedEmployeeId?: string;
}

export interface UpdateConversationDto {
  status?: "ACTIVE" | "CLOSED" | "PENDING" | "ARCHIVED";
  assignedEmployeeId?: string;
}
