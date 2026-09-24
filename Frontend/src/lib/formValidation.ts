import { PET_SPECIES } from "@shared/constants/pet-species.constants";
import { PET_STATUS } from "@shared/constants/pet-status.constants";
import { MEDICAL_STATUS } from "@shared/constants/medical-status.constants";
import { SUPPLY_CATEGORIES } from "@shared/constants/supply-categories.constants";
import { SupplyStatusEnum } from "@shared/enums/supply-status.enum";
import { VaccineStatusEnum } from "@shared/enums/vaccine-status.enum";
import translations, { type Lang } from "../i18n/translations";
import { isEmail, isStrongPassword, validateDocumentFile, validateImageFile } from "./validation";

type Rule = {
  kind: "text" | "email" | "phone" | "password" | "date" | "number" | "choice" | "id" | "boolean" | "ids";
  required?: boolean; max?: number; min?: number; decimals?: number; values?: readonly string[]; matches?: string;
};
export type FormSchema = Record<string, Rule>;
const text = (max: number, required = false): Rule => ({ kind: "text", max, required });
const number = (decimals = 0, min = 0, required = false): Rule => ({ kind: "number", decimals, min, required });
const choice = (values: readonly string[], required = false): Rule => ({ kind: "choice", values, required });
const phone: Rule = { kind: "phone", max: 30 };
const email: Rule = { kind: "email", max: 254, required: true };
const password: Rule = { kind: "password", max: 255, min: 8, required: true };
const id: Rule = { kind: "id", required: true };
const date: Rule = { kind: "date", required: true };
const profile: FormSchema = { firstName: text(80, true), lastName: text(80, true), phone, address: text(1000), avatar: text(2048) };
const employee: FormSchema = { ...profile, email, password, roleId: id, departmentId: id, salary: number(2), hireDate: date, status: choice(["active", "inactive"]) };
const pet: FormSchema = { name: text(120, true), species: choice(Object.values(PET_SPECIES), true), breed: text(120), age: number(), gender: text(30), color: text(80), weight: number(2), description: text(5000), adoptionStatus: choice(Object.values(PET_STATUS)), healthStatus: text(80) };
const supplier: FormSchema = { supplierName: text(160, true), phone: { ...phone, required: true }, email: { ...email, max: 255 }, address: text(5000, true), city: text(100, true), country: text(100, true) };
const supply: FormSchema = { supplyName: text(160, true), category: choice(Object.values(SUPPLY_CATEGORIES), true), supplierId: id, quantity: number(0, 0, true), sellingPrice: number(2, 0, true), purchasePrice: number(2, 0, true), lowStockLimit: number(0, 0, true), minimumOrderQuantity: number(0, 1, true), deliveryTimeDays: number(), status: choice(Object.values(SupplyStatusEnum)), storeListed: { kind: "boolean" } };
const vaccination: FormSchema = { vaccineName: text(160, true), vaccinationDate: date, nextDueDate: { ...date, required: false }, batch: text(120), status: choice(Object.values(VaccineStatusEnum)), notes: text(5000) };
const medical: FormSchema = { diagnosis: text(5000, true), treatment: text(5000, true), medicalDate: date, vaccinationStatus: choice(Object.values(MEDICAL_STATUS), true), notes: text(5000) };

// These limits follow the shared backend DTOs. Optional fields may be cleared;
// a supplied required field must still contain a non-whitespace value on edits.
export const formSchemas = {
  profile, employee, pet, supplier, supply, vaccination, medical,
  department: { departmentName: text(120, true), description: text(1000) } as FormSchema,
  vetProfile: {
    name: text(161, true), email, phone, specialization: text(160, true), licenseNumber: text(120, true),
    experience: number(0, 0, true), clinic: text(160, true), clinicAddress: text(1000, true), bio: text(1000),
  } as FormSchema,
};

export function isValidDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(value);
  if (!match || !Number.isFinite(Date.parse(value))) return false;
  return new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00Z`).toISOString().slice(0, 10) === value.slice(0, 10);
}

export function isPhone(value: string) {
  const normalized = value.trim().replace(/[\u0660-\u0669\u06f0-\u06f9]/g, digit => String(digit.charCodeAt(0) - (digit.charCodeAt(0) >= 0x06f0 ? 0x06f0 : 0x0660)));
  return /^\+?[\d\s().-]+$/.test(normalized) && /^\d{7,15}$/.test(normalized.replace(/\D/g, ""));
}

export function validateFields(schema: FormSchema, values: Record<string, unknown>, t: (key: string) => string, options: { partial?: boolean; mockIds?: boolean } = {}) {
  const errors: Record<string, string> = {};
  for (const [field, rule] of Object.entries(schema)) {
    const raw = values[field];
    if (options.partial && raw === undefined) continue;
    const value = typeof raw === "string" ? raw.trim() : raw;
    if (value === undefined || value === null || value === "") {
      if (rule.required) errors[field] = t("checkout_field_required");
      continue;
    }
    if (typeof raw === "string" && rule.max !== undefined && [...raw].length > rule.max) {
      errors[field] = t("checkout_field_max").replace("{max}", String(rule.max));
      continue;
    }
    let valid = true;
    switch (rule.kind) {
      case "text": valid = typeof raw === "string" && (rule.min === undefined || raw.length >= rule.min); break;
      case "email": valid = typeof value === "string" && isEmail(value); break;
      case "phone": valid = typeof value === "string" && isPhone(value); break;
      case "password": valid = typeof raw === "string" && isStrongPassword(raw); break;
      case "date": valid = typeof value === "string" && isValidDate(value); break;
      case "number": {
        const n = typeof value === "string" ? Number(value) : value;
        const factor = 10 ** (rule.decimals ?? 0);
        valid = typeof n === "number" && Number.isFinite(n) && n >= (rule.min ?? 0) && n <= Number.MAX_SAFE_INTEGER / factor && Math.abs(n * factor - Math.round(n * factor)) < 1e-7;
        break;
      }
      case "choice": valid = typeof value === "string" && !!rule.values?.includes(value); break;
      case "boolean": valid = typeof value === "boolean"; break;
      case "id": valid = typeof value === "string" && (options.mockIds || /^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(value)); break;
      case "ids": valid = Array.isArray(value) && value.length > 0 && value.every(item => typeof item === "string" && (options.mockIds || /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(item))); break;
    }
    if (!valid) errors[field] = t(rule.kind === "phone" ? "checkout_phone_invalid" : rule.kind === "password" ? "reset_password_rules_error" : rule.kind === "number" ? "validation_number" : rule.kind === "date" ? "validation_date" : rule.kind === "email" ? "error_valid_email" : "validation_invalid");
    if (rule.matches && raw !== values[rule.matches]) errors[field] = t("signup_password_mismatch");
  }
  if (values.nextDueDate && values.vaccinationDate && String(values.nextDueDate) < String(values.vaccinationDate)) errors.nextDueDate = t("validation_date_order");
  return errors;
}

const fieldLabels: Record<string, string> = {
  firstName: "profile_first_name", lastName: "profile_last_name", email: "profile_email", phone: "profile_phone", address: "profile_address",
  password: "login_password", currentPassword: "security_current_pw", newPassword: "security_new_pw_ph", confirmPassword: "signup_confirm_password",
  diagnosis: "medical_diagnosis", treatment: "medical_treatment", notes: "pet_notes", city: "cart_city", name: "pet_table_name",
  quantity: "inventory_quantity", sellingPrice: "inventory_selling_price", purchasePrice: "inventory_purchase_price", message: "nav_chats",
};

export function validationMessage(errors: Record<string, string>, t: (key: string) => string) {
  return Object.entries(errors).map(([field, message]) => {
    const translated = fieldLabels[field] ? t(fieldLabels[field]) : "";
    const label = translated && translated !== fieldLabels[field] ? translated : field.replace(/([A-Z])/g, " $1");
    return `${label}: ${message}`;
  }).join("\n");
}

export function assertValidFields(schema: FormSchema, values: Record<string, unknown>, t: (key: string) => string, options: { partial?: boolean; mockIds?: boolean } = {}) {
  const errors = validateFields(schema, values, t, options);
  if (Object.keys(errors).length) throw new Error(validationMessage(errors, t));
}

// All API-backed forms pass through this check before fetch, including calls
// made outside a native <form>. Form components still provide input constraints.
export function validateRequest(path: string, init: RequestInit, mockIds = false) {
  const lang = (typeof document !== "undefined" ? document.documentElement.lang : "en") as Lang;
  const t = (key: string) => translations[lang]?.[key] ?? translations.en[key] ?? key;
  const url = new URL(path, "https://petopia.invalid");
  const method = (init.method ?? "GET").toUpperCase();
  if (method === "GET") {
    if (/^\/reports\//.test(url.pathname)) {
      const values = Object.fromEntries(url.searchParams);
      assertValidFields({ from: { ...date, required: false }, to: { ...date, required: false }, minAge: number(), maxAge: number(), species: text(80), health: text(80), category: text(100), supplier: text(160) }, values, t);
      if (values.from && values.to && values.to < values.from) throw new Error(t("validation_date_order"));
      if (values.minAge && values.maxAge && Number(values.minAge) > Number(values.maxAge)) throw new Error(t("validation_age_order"));
    }
    return;
  }
  if (init.body instanceof FormData) {
    for (const value of init.body.values()) {
      if (!(value instanceof File)) continue;
      const error = /^\/pets\/[^/]+\/medical-record\/(?:documents|import(?:\/bulk)?)$/.test(url.pathname) ? validateDocumentFile(value) : validateImageFile(value, t);
      if (error) throw new Error(error);
    }
    return;
  }
  if (typeof init.body !== "string") return;
  const values = JSON.parse(init.body) as Record<string, unknown>;
  const pathname = url.pathname;
  let schema: FormSchema | undefined;
  if (pathname === "/auth/login") schema = { email, password: { ...text(255, true), min: 1 } };
  else if (["/auth/signup", "/auth/register"].includes(pathname)) schema = { firstName: profile.firstName, lastName: profile.lastName, email, password, phone, ...(pathname.endsWith("signup") ? { confirmPassword: { ...text(255, true), matches: "password" } } : {}) };
  else if (pathname === "/auth/forgot-password") schema = { email };
  else if (pathname === "/auth/reset-password") schema = { token: text(255, true), newPassword: password, confirmPassword: { ...text(255, true), matches: "newPassword" } };
  else if (pathname === "/auth/change-password") schema = { currentPassword: { ...text(255, true), min: 8 }, newPassword: password, confirmPassword: { ...text(255, true), matches: "newPassword" } };
  else if (pathname === "/users/profile") schema = profile;
  else if (pathname === "/users/employees") schema = employee;
  else if (/^\/users\/[^/]+$/.test(pathname)) schema = { ...profile, roleId: id, departmentId: id, salary: number(2), hireDate: date, status: choice(["active", "inactive"]) };
  else if (/^\/departments(?:\/[^/]+)?$/.test(pathname)) schema = formSchemas.department;
  else if (/^\/departments\/[^/]+\/users$/.test(pathname)) schema = { userIds: { kind: "ids", required: true } };
  else if (/^\/inventory\/suppliers(?:\/[^/]+)?$/.test(pathname)) schema = supplier;
  else if (/^\/inventory\/supplies(?:\/[^/]+)?$/.test(pathname)) schema = supply;
  else if (/^\/pets(?:\/[^/]+)?$/.test(pathname)) schema = pet;
  else if (/^\/pets\/[^/]+\/medical-record\/entries$/.test(pathname) || /^\/medical-entries\/[^/]+$/.test(pathname)) schema = medical;
  else if (/^\/pets\/[^/]+\/vaccinations$/.test(pathname) || /^\/vaccinations\/[^/]+$/.test(pathname)) schema = vaccination;
  else if (/^\/adoption\/requests(?:\/[^/]+)?$/.test(pathname)) schema = { petId: id, notes: text(1000) };
  else if (/^\/conversations\/[^/]+\/messages$/.test(pathname)) schema = { messageText: text(5000, true), type: choice(["TEXT", "IMAGE", "VIDEO", "AUDIO", "FILE"]) };
  if (schema) assertValidFields(schema, values, t, { partial: method === "PATCH", mockIds });
}
