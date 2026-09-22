export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
  },
  PETS: {
    LIST: "/pets",
    CREATE: "/pets",
    GET: "/pets/:id",
    UPDATE: "/pets/:id",
    DELETE: "/pets/:id",
    SEARCH: "/pets/search",
  },
  ADOPTION: {
    REQUESTS: "/adoption/requests",
    CREATE_REQUEST: "/adoption/requests",
    APPROVE: "/adoption/requests/:id/approve",
    REJECT: "/adoption/requests/:id/reject",
    GET_ADOPTIONS: "/adoption/adoptions",
  },
  MEDICAL: {
    RECORDS: "/medical/records",
    CREATE: "/medical/records",
    GET: "/medical/records/:id",
  },
  INVENTORY: {
    SUPPLIES: "/inventory/supplies",
    SUPPLIERS: "/inventory/suppliers",
  },
  DEPARTMENTS: {
    LIST: "/departments",
    CREATE: "/departments",
    GET: "/departments/:id",
    UPDATE: "/departments/:id",
    DELETE: "/departments/:id",
    ASSIGN_USERS: "/departments/:id/users",
  },
  MESSAGES: {
    CONVERSATIONS: "/conversations/my",
    INBOX: "/conversations/inbox",
    CREATE: "/conversations",
    SEND: "/conversations/:id/messages",
    LIST: "/conversations/:id",
  },
  FRIENDS: {
    LIST: "/users/friends",
    CANDIDATES: "/users/friends/candidates",
    ADD: "/users/friends/:friendId",
    REMOVE: "/users/friends/:friendId",
  },
  NOTIFICATIONS: {
    LIST: "/notifications",
    UNREAD_COUNT: "/notifications/unread-count",
    MARK_READ: "/notifications/:id/read",
    MARK_ALL_READ: "/notifications/read-all",
  },
};
