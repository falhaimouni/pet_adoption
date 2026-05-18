export type NotificationType = "MESSAGE" | "ADOPTION" | "INVENTORY" | "SYSTEM";
export type NotificationStatus = "READ" | "UNREAD";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}