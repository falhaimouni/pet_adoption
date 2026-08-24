type BadgeVariant = "success" | "pending" | "rejected" | "info" | "warning" | "neutral" | "teal";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: "sm" | "md";
}

const variants: Record<BadgeVariant, string> = {
  teal: "bg-[rgba(8,157,151,0.12)] text-[#089D97] border border-[#089D97]",
  success: "bg-green-50 text-green-700 border border-green-300",
  pending: "bg-yellow-50 text-yellow-700 border border-yellow-300",
  rejected: "bg-red-50 text-red-600 border border-red-300",
  info: "bg-blue-50 text-blue-600 border border-blue-300",
  warning: "bg-orange-50 text-orange-600 border border-orange-300",
  neutral: "bg-gray-100 text-gray-600 border border-gray-300",
};

export default function Badge({ label, variant = "neutral", size = "sm" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-['Poppins',sans-serif] font-medium whitespace-nowrap ${
        size === "sm" ? "text-[11px] px-2.5 py-0.5" : "text-[13px] px-3 py-1"
      } ${variants[variant]}`}
    >
      {label}
    </span>
  );
}

export function statusBadge(status: string): BadgeVariant {
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
  return map[status.toLowerCase()] ?? "neutral";
}
