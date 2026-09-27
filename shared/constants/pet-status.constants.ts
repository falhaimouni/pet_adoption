export const PET_STATUS = {
  AVAILABLE: "AVAILABLE",
  PENDING: "PENDING",
  ADOPTED: "ADOPTED",
  MEDICAL_HOLD: "MEDICAL_HOLD",
};

export function normalizePetStatus(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim().replace(/[\s-]+/g, "_").toUpperCase();
  return Object.values(PET_STATUS).includes(normalized)
    ? normalized
    : value;
}
