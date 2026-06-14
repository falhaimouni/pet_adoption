declare const CONVERSATION_STATUSES: readonly ["ACTIVE", "CLOSED", "PENDING", "ARCHIVED"];
export declare class CreateConversationDto {
    assignedEmployeeId?: string;
}
export declare class UpdateConversationDto {
    status?: (typeof CONVERSATION_STATUSES)[number];
    assignedEmployeeId?: string;
}
export {};
