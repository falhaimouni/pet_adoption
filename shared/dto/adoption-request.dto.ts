export interface CreateAdoptionRequestDto {
  petId: string;
  adopterId: string;
  notes?: string;
}

export interface UpdateAdoptionRequestDto {
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  reviewedBy?: string;
  notes?: string;
}
