import { ConversationStatusEnum } from '../enums/conversation-status.enum';

export interface Conversation {
  conversationId: string;
  adopterId: string;
  assignedEmployeeId?: string | null;
  status: ConversationStatusEnum;
  createdAt: string;
  updatedAt: string;
}
