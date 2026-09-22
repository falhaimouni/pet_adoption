import { MessageType } from '../enums/message-type.enum';

export interface Message {
  messageId: string;
  conversationId: string;
  senderId: string;
  messageText?: string | null;
  fileUrl?: string | null;
  type: MessageType;
  isRead: boolean;
  createdAt: string;
}
