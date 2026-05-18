export interface CreateVaccinationDto {
  petId: string;
  vaccineName: string;
  vaccinationDate: string;
  nextDueDate: string;
  veterinarianId: string;
  notes?: string;
}

export interface UpdateVaccinationDto {
  vaccineName?: string;
  vaccinationDate?: string;
  nextDueDate?: string;
  status?: "VACCINATED" | "PENDING" | "OVERDUE";
  notes?: string;
}
