export type NotificationType = "MESSAGE" | "ADOPTION" | "INVENTORY";
export type NotificationStatus = "READ" | "UNREAD";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}
