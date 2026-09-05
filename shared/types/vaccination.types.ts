export interface Vaccination {
  id: string;
  petId: string;
  vaccineName: string;
  vaccinationDate: string;
  nextDueDate: string;
  veterinarianId: string;
  status: "VACCINATED" | "PENDING" | "OVERDUE";
  notes?: string;
}
