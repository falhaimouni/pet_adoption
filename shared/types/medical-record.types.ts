export interface MedicalRecord {
  id: string;
  petId: string;
  veterinarianId: string;
  diagnosis: string;
  treatment: string;
  vaccinationStatus: string;
  medicalDate: string;
  notes?: string;
  createdAt: string;
}
