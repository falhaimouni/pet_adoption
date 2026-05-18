export interface AdoptionDto {
  id: string;
  requestId: string;
  adoptionDate: string;
  adoptionFee?: number;
  contractStatus: "PENDING" | "SIGNED" | "CANCELLED";
  completedAt?: string;
}