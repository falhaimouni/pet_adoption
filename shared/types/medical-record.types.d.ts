export interface MedicalRecord {
    recordId: string;
    petId: string;
    createdAt: string;
    entries?: MedicalEntry[];
}
export interface MedicalEntry {
    entryId: string;
    recordId: string;
    veterinarianId: string;
    diagnosis: string;
    treatment: string;
    vaccinationStatus: string;
    medicalDate: string;
    notes?: string;
    createdAt: string;
}
