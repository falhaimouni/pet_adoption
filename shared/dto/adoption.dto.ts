export interface AdoptionDto {
  id: string;
  requestId: string;
  adoptionDate: string;
  adoptionFee?: number;
  completedAt?: string;
}
