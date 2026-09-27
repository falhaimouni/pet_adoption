import { useEffect, useMemo, useState } from "react";
import { Eye, PackageCheck, Search } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import Badge, { statusBadge } from "../../components/Badge";
import EmptyState from "../../components/EmptyState";
import Modal from "../../components/Modal";
import { apiFetch } from "../../lib/api";
import type { UserRole } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

interface OrderProduct {
  productName?: string;
}

interface OrderItem {
  orderItemId?: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  product?: OrderProduct;
}

interface OrderPayment {
  paymentId: string;
  amount: string;
  paymentMethod: string;
  paymentStatus: string;
  paidAt: string | null;
}

interface OrderUser {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

interface Order {
  orderId: string;
  orderReference: string;
  totalPrice: string;
  recipientName: string;
  phoneNumber: string;
  addressLine: string;
  city: string;
  postalCode?: string | null;
  deliveryNotes?: string | null;
  orderStatus: string;
  createdAt: string;
  user?: OrderUser;
  orderItems?: OrderItem[];
  payments?: OrderPayment[];
}

interface AdminOrdersPageProps {
  onNavigate: (page: string) => void;
  role?: UserRole;
  activePage?: string;
}

function orderPageForRole(role: UserRole) {
  if (role === "manager") return "manager-orders";
  if (role === "employee") return "staff-orders";
  return "admin-orders";
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function customerName(order: Order) {
  const userName = `${order.user?.firstName ?? ""} ${order.user?.lastName ?? ""}`.trim();
  return userName || order.recipientName;
}

export default function AdminOrdersPage({ onNavigate, role = "admin", activePage = orderPageForRole(role) }: AdminOrdersPageProps) {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    apiFetch<Order[]>("/orders")
      .then(setOrders)
      .catch((err) => setError(err instanceof Error ? err.message : t("orders_load_error")))
      .finally(() => setLoading(false));
  }, [t]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return orders;
    return orders.filter((order) => {
      const haystack = [
        order.orderReference,
        order.recipientName,
        order.phoneNumber,
        order.city,
        order.orderStatus,
        customerName(order),
        order.user?.email ?? "",
      ].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [orders, search]);

  return (
    <DashboardLayout role={role} activePage={activePage} onNavigate={onNavigate} pageTitle={t("nav_orders")} breadcrumbs={[t(`role_${role}`), t("nav_orders")]}>
      <div className="bg-white rounded-[15px] shadow-md p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div className="relative max-w-sm flex-1">
            <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-[#089D97]" />
            <input
              placeholder={t("orders_search_ph")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full ps-8 pe-3 py-2 border border-gray-200 rounded-[10px] font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors"
            />
          </div>
          <span className="font-['Poppins',sans-serif] text-[12px] text-black/50">{filtered.length} {t("nav_orders")}</span>
        </div>

        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((n) => <div key={n} className="h-[58px] rounded-[10px] bg-gray-50 animate-pulse" />)}</div>
        ) : error ? (
          <EmptyState icon={<PackageCheck size={28} />} title={t("orders_load_error")} description={error} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<PackageCheck size={28} />} title={t("orders_empty_title")} description={t("orders_empty_desc")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead>
                <tr className="border-b border-gray-100">
                  {[t("th_order"), t("th_customer"), t("th_recipient"), t("th_city"), t("th_total"), t("th_status"), t("th_date"), t("table_actions")].map((h) => (
                    <th key={h} className="py-2.5 px-3 font-['Poppins',sans-serif] font-semibold text-[11px] text-black/50 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.orderId} className="border-b border-gray-50 hover:bg-[rgba(8,157,151,0.03)] transition-colors">
                    <td className="py-3 px-3 font-['Poppins',sans-serif] font-medium text-[13px] text-black">{order.orderReference}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{customerName(order)}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{order.recipientName}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/60">{order.city}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] font-semibold text-[13px] text-[#089D97]">${Number(order.totalPrice).toFixed(2)}</td>
                    <td className="py-3 px-3"><Badge label={order.orderStatus.toLowerCase()} variant={statusBadge(order.orderStatus.toLowerCase())} /></td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/60">{formatDate(order.createdAt)}</td>
                    <td className="py-3 px-3">
                      <button onClick={() => setViewOrder(order)} className="w-8 h-8 inline-flex items-center justify-center rounded-[9px] text-[#089D97] hover:bg-[#e0f2f0] transition-colors" aria-label={t("orders_view_details")}>
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal title={t("orders_details_title")} open={!!viewOrder} onClose={() => setViewOrder(null)} size="lg">
        {viewOrder && (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-3 font-['Poppins',sans-serif] text-[13px]">
              <Info label={t("th_order")} value={viewOrder.orderReference} />
              <Info label={t("th_customer")} value={customerName(viewOrder)} />
              <Info label={t("cart_recipient_name")} value={viewOrder.recipientName} />
              <Info label={t("cart_phone_number")} value={viewOrder.phoneNumber} />
              <Info label={t("cart_address_line")} value={`${viewOrder.addressLine}, ${viewOrder.city}${viewOrder.postalCode ? ` ${viewOrder.postalCode}` : ""}`} />
              <Info label={t("th_status")} value={viewOrder.orderStatus} />
            </div>

            <div>
              <h3 className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#1a2e2d] mb-2">{t("orders_items_title")}</h3>
              <div className="divide-y divide-gray-100 rounded-[12px] border border-gray-100">
                {(viewOrder.orderItems ?? []).map((item) => (
                  <div key={item.orderItemId ?? item.productId} className="flex items-center justify-between gap-3 px-3 py-2 font-['Poppins',sans-serif] text-[13px]">
                    <span className="text-black/70">{item.product?.productName ?? item.productId}</span>
                    <span className="text-black/50">x{item.quantity}</span>
                    <span className="font-semibold text-[#089D97]">${Number(item.subtotal).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-[12px] bg-[#f0f8f7] px-4 py-3 font-['Poppins',sans-serif]">
              <span className="text-[13px] font-semibold text-[#1a2e2d]">{t("cart_total")}</span>
              <span className="text-[18px] font-bold text-[#089D97]">${Number(viewOrder.totalPrice).toFixed(2)}</span>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] bg-[#f8fcfb] px-3 py-2">
      <p className="text-[11px] uppercase tracking-wider text-black/40">{label}</p>
      <p className="mt-1 text-[13px] font-medium text-[#1a2e2d] break-words">{value || "-"}</p>
    </div>
  );
}
