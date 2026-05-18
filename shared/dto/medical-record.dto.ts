export interface CreateMedicalRecordDto {
  petId: string;
  veterinarianId: string;
  diagnosis: string;
  treatment: string;
  vaccinationStatus: string;
  medicalDate: string;
  notes?: string;
}

export interface UpdateMedicalRecordDto {
  diagnosis?: string;
  treatment?: string;
  vaccinationStatus?: string;
  notes?: string;
}
