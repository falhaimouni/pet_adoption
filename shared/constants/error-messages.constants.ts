export const ERROR_MESSAGES = {
  // Auth errors
  INVALID_CREDENTIALS: "Invalid email or password",
  EMAIL_ALREADY_EXISTS: "Email already registered",
  USER_NOT_FOUND: "User not found",
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "Forbidden - insufficient permissions",
  TOKEN_EXPIRED: "Token expired",
  INVALID_TOKEN: "Invalid token",

  // Pet errors
  PET_NOT_FOUND: "Pet not found",
  INVALID_PET_STATUS: "Invalid pet status",

  // Adoption errors
  ADOPTION_REQUEST_NOT_FOUND: "Adoption request not found",
  INVALID_ADOPTION_STATUS: "Invalid adoption status",
  PET_NOT_AVAILABLE: "Pet is not available for adoption",
  DUPLICATE_REQUEST: "You already have a pending request for this pet",

  // Medical errors
  MEDICAL_RECORD_NOT_FOUND: "Medical record not found",
  VACCINATION_NOT_FOUND: "Vaccination record not found",

  // Inventory errors
  SUPPLY_NOT_FOUND: "Supply not found",
  SUPPLIER_NOT_FOUND: "Supplier not found",
  LOW_STOCK: "Low stock alert",

  // Conversation/Message errors
  CONVERSATION_NOT_FOUND: "Conversation not found",
  MESSAGE_NOT_FOUND: "Message not found",

  // General errors
  VALIDATION_ERROR: "Validation error",
  INTERNAL_SERVER_ERROR: "Internal server error",
  NOT_FOUND: "Resource not found",
  BAD_REQUEST: "Bad request",
  CONFLICT: "Resource conflict",
};
