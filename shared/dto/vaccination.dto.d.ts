import { VaccineStatusEnum } from '../enums/vaccine-status.enum';
export declare class CreateVaccinationDto {
    vaccineName: string;
    vaccinationDate: string;
    nextDueDate?: string;
    notes?: string;
}
export declare class UpdateVaccinationDto {
    vaccineName?: string;
    vaccinationDate?: string;
    nextDueDate?: string;
    status?: VaccineStatusEnum;
    notes?: string;
}
