export type NotificationType =
  | "MESSAGE"
  | "ADOPTION"
  | "INVENTORY"
  | "PET"
  | "MEDICAL"
  | "USER"
  | "DEPARTMENT"
  | "ORDER"
  | "COMMUNITY"
  | "FRIEND"
  | "SYSTEM";
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
