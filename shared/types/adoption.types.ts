export interface AdoptionRequest {
  id: string;
  petId: string;
  adopterId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
  notes?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Adoption {
  id: string;
  requestId: string;
  adoptionDate: string;
  adoptionFee?: number;
  contractStatus: string;
  completedAt?: string;
}