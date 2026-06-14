export declare class CreatePetDto {
    name: string;
    species: string;
    breed?: string;
    age?: number;
    gender?: string;
    color?: string;
    weight?: number;
    description?: string;
    image?: string;
}
export declare class UpdatePetDto {
    name?: string;
    species?: string;
    breed?: string;
    age?: number;
    gender?: string;
    color?: string;
    weight?: number;
    description?: string;
    adoptionStatus?: string;
    healthStatus?: string;
}
