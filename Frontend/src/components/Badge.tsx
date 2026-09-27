import { useLanguage } from "../context/LanguageContext";

type BadgeVariant = "success" | "pending" | "rejected" | "info" | "warning" | "neutral" | "teal";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: "sm" | "md";
}

const variants: Record<BadgeVariant, string> = {
  teal: "bg-[rgba(8,157,151,0.12)] text-primary border border-primary",
  success: "bg-green-50 text-green-700 border border-green-300",
  pending: "bg-yellow-50 text-yellow-700 border border-yellow-300",
  rejected: "bg-red-50 text-red-600 border border-red-300",
  info: "bg-blue-50 text-blue-600 border border-blue-300",
  warning: "bg-orange-50 text-orange-600 border border-orange-300",
  neutral: "bg-gray-100 text-gray-600 border border-gray-300",
};

export default function Badge({ label, variant = "neutral", size = "sm" }: BadgeProps) {
  const { t } = useLanguage();
  const translatedLabel = translateBadgeLabel(label, t);

  return (
    <span
      className={`inline-flex items-center rounded-full font-['Poppins',sans-serif] font-medium whitespace-nowrap ${
        size === "sm" ? "text-[11px] px-2.5 py-0.5" : "text-[13px] px-3 py-1"
      } ${variants[variant]}`}
    >
      {translatedLabel}
    </span>
  );
}

function translateBadgeLabel(label: string, t: (key: string) => string) {
  const normalized = label.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const aliases: Record<string, string> = {
    staff: "role_employee",
    employee: "role_employee",
    employees: "role_employee_plural",
    vet: "role_vet",
    veterinarian: "role_vet",
    manager: "role_manager",
    admin: "role_admin",
    adopter: "role_adopter",
    available: "status_available",
    pending: "status_pending",
    approved: "status_approved",
    rejected: "status_rejected",
    cancelled: "req_cancelled",
    canceled: "req_cancelled",
    adopted: "status_adopted",
    active: "status_active",
    inactive: "status_inactive",
    low_stock: "status_low_stock",
    out_of_stock: "status_out_of_stock",
    in_stock: "status_in_stock",
    open: "status_open",
    closed: "status_closed",
    waiting: "status_waiting",
    archived: "status_archived",
    completed: "status_completed",
    given: "status_given",
    due: "status_due",
    overdue: "status_overdue",
    critical: "status_critical",
    high: "status_high",
    vaccinated: "vet_vaccinated",
    listed: "status_listed",
    hidden: "status_hidden",
    expired: "status_expired",
    damaged: "status_damaged",
    discontinued: "status_discontinued",
    medical_hold: "pet_status_medical_hold",
  };
  const key = aliases[normalized] ?? `status_${normalized}`;
  const translated = t(key);
  return translated === key ? label : translated;
}

export function statusBadge(status: string): BadgeVariant {
  const normalized = status.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const map: Record<string, BadgeVariant> = {
    available: "teal",
    active: "success",
    approved: "success",
    adopted: "info",
    pending: "pending",
    waiting: "pending",
    rejected: "rejected",
    cancelled: "neutral",
    closed: "neutral",
    archived: "neutral",
    low: "warning",
    critical: "rejected",
    in_stock: "success",
    "in stock": "success",
    "low stock": "warning",
    "out of stock": "rejected",
    medical_hold: "warning",
    online: "success",
    offline: "neutral",
    unread: "teal",
    read: "neutral",
    assigned: "info",
    open: "teal",
    resolved: "success",
    admin: "rejected",
    manager: "warning",
    staff: "info",
    vet: "teal",
    adopter: "success",
  };
  return map[normalized] ?? "neutral";
}
