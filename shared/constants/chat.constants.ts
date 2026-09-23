export const CHAT_ALLOWED_ROLES = [
  "ADOPTER",
  "ADMIN",
  "MANAGER",
  "EMPLOYEE",
] as const;

export const CHAT_SENDER_ROLES = [
  "ADMIN",
  "MANAGER",
  "ADOPTER",
  "EMPLOYEE",
] as const;

// Social friendships require mutual consent between adopters.
export const FRIEND_SYSTEM_ROLES = ["ADOPTER"] as const;
export const COMMUNITY_MODERATOR_ROLES = ["ADMIN", "MANAGER", "EMPLOYEE"] as const;
