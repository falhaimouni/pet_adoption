export interface MedicalSummary {
    petId: string;
    lastCheckupDate?: string;
    nextCheckupDate?: string;
    hasChronicCondition?: boolean;
    notes?: string;
}
