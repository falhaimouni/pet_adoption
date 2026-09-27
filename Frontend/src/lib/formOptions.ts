import { PET_GENDER, PET_HEALTH_STATUS } from "@shared/constants/pet-profile.constants";

export const PET_SPECIES_OPTIONS = ["Dog", "Cat", "Rabbit", "Bird"] as const;

export const PET_GENDER_OPTIONS = Object.values(PET_GENDER);

export const PET_STATUS_OPTIONS = ["AVAILABLE", "PENDING", "ADOPTED", "MEDICAL_HOLD"] as const;

export function normalizePetStatus(value: string | null | undefined, fallback = PET_STATUS_OPTIONS[0]): string {
  if (!value) return fallback;

  const normalized = value.trim().replace(/[\s-]+/g, "_").toUpperCase();
  return PET_STATUS_OPTIONS.includes(normalized as (typeof PET_STATUS_OPTIONS)[number])
    ? normalized
    : fallback;
}

export const PET_HEALTH_STATUS_OPTIONS = Object.values(PET_HEALTH_STATUS);

export const COMMON_BREED_OPTIONS = [
  "Mixed Breed",
  "Labrador Retriever",
  "Golden Retriever",
  "German Shepherd",
  "Persian",
  "Siamese",
  "Domestic Shorthair",
  "Holland Lop",
  "Parakeet",
] as const;

export const COMMON_COLOR_OPTIONS = [
  "Black",
  "White",
  "Brown",
  "Golden",
  "Gray",
  "Orange",
  "Calico",
  "Tabby",
  "Mixed",
] as const;

export const COMMON_CITY_OPTIONS = [
  "Amman",
  "Irbid",
  "Zarqa",
  "Aqaba",
  "Salt",
  "Madaba",
] as const;

export const COMMON_COUNTRY_OPTIONS = [
  "Jordan",
  "United Arab Emirates",
  "Saudi Arabia",
  "Egypt",
  "Lebanon",
] as const;
