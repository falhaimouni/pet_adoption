export const CHAT_ALLOWED_ROLES = [
  "ADOPTER",
  "ADMIN",
  "MANAGER",
  "EMPLOYEE",
] as const;

export const CHAT_SENDER_ROLES = [
  "ADOPTER",
  "EMPLOYEE",
] as const;

export const FRIEND_SYSTEM_ROLES = [
  "ADMIN",
  "MANAGER",
  "EMPLOYEE",
  "VET",
] as const;

export const FRIEND_MANUAL_ROLES = [
  "EMPLOYEE",
  "VET",
] as const;

export const FRIEND_AUTO_ROLES = [
  "ADMIN",
  "MANAGER",
] as const;
