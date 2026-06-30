export type UserRole =
  | "ADMIN"
  | "MANAGER"
  | "VET"
  | "EMPLOYEE"
  | "ADOPTER";

export type UserStatus = "ACTIVE" | "SUSPENDED" | "INACTIVE";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  oauthProvider?: string;
  createdAt: string;
  updatedAt: string;
}
