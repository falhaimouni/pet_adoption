import { useText } from "../../i18n/useText";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, PackageCheck } from "lucide-react";
import type { OrderDto } from "@shared/dto/order.dto";
import DashboardLayout from "../../components/DashboardLayout";
import Badge from "../../components/Badge";
import EmptyState from "../../components/EmptyState";
import Modal from "../../components/Modal";
import { useCart } from "../../context/CartContext";
import { useLanguage } from "../../context/LanguageContext";
import { apiFetch } from "../../lib/api";

type CustomerOrder = Omit<OrderDto, "orderItems"> & {
  orderItems: (OrderDto["orderItems"][number] & { product?: { productName?: string } })[];
};

interface OrdersPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
  orderId?: string;
}

export default function OrdersPage({ onNavigate, orderId }: OrdersPageProps) {
  const tx = useText();
  const { t, lang } = useLanguage();
  const { refreshCart } = useCart();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [reload, setReload] = useState(0);
  const inFlight = useRef(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setActionError("");
    setConfirmCancel(false);
    setOrder(null);
    const request = orderId
      ? apiFetch<CustomerOrder>(`/orders/me/${encodeURIComponent(orderId)}`).then(value => { if (active) setOrder(value); })
      : apiFetch<CustomerOrder[]>("/orders/me").then(value => { if (active) setOrders(value); });
    request.catch(err => { if (active) setError(err instanceof Error ? err.message : t("orders_load_error")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [orderId, reload]);

  async function changeOrder(action: "pay" | "cancel") {
    if (!order || order.orderStatus !== "PENDING" || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setActionError("");
    try {
      const updated = await apiFetch<CustomerOrder>(`/checkout/${encodeURIComponent(order.orderId)}/${action}`, { method: "POST" });
      setOrder(updated);
      setConfirmCancel(false);
      if (action === "pay") await refreshCart();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("order_action_error"));
      setConfirmCancel(false);
      // Another tab may already have paid or canceled this order.
      try { setOrder(await apiFetch<CustomerOrder>(`/orders/me/${encodeURIComponent(order.orderId)}`)); } catch { /* Keep the current order and show the action error. */ }
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  const money = (value: string) => `$${Number(value).toFixed(2)}`;
  const status = (value: CustomerOrder) => <Badge label={value.orderStatus.toLowerCase()} variant={value.orderStatus === "COMPLETED" ? "success" : value.orderStatus === "PENDING" ? "pending" : "neutral"} />;
  const buttonClass = "rounded-[12px] px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-50";

  return (
    <DashboardLayout role="adopter" activePage="orders" onNavigate={onNavigate} pageTitle={t(orderId ? "orders_details_title" : "nav_orders")}>
      <div className="mx-auto max-w-5xl font-['Poppins',sans-serif]">
        <button onClick={() => onNavigate(orderId ? "orders" : "cart")} disabled={busy} className="mb-5 flex items-center gap-2 text-sm text-[#047975]">
          <ArrowLeft size={16} /> {t(orderId ? "order_all" : "order_back_cart")}
        </button>
        {loading ? <p role="status">{t("common_loading")}</p> : error ? (
          <EmptyState title={t("orders_load_error")} description={error} actionLabel={t("common_try_again")} onAction={() => setReload(value => value + 1)} />
        ) : orderId && order ? (
          <div className="space-y-5">
            <section className="rounded-[18px] bg-white p-4 sm:p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-[#1a2e2d]">{t("cart_order_reference")}</h2>
                {status(order)}
              </div>
              <p className="mt-2 break-all text-sm text-[#5a8a87]">{order.orderReference}</p>
              <p className="mt-3 text-sm text-[#1a2e2d]" role="status">{t(order.orderStatus === "PENDING" ? "order_pending_desc" : order.orderStatus === "COMPLETED" ? "order_paid_desc" : "order_canceled_desc")}</p>
              {actionError && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
            </section>
            <div className="grid gap-5 lg:grid-cols-2">
              <section className="min-w-0 rounded-[18px] bg-white p-4 sm:p-6 shadow-sm">
                <h2 className="mb-4 font-semibold text-[#1a2e2d]">{t("orders_items_title")}</h2>
                <div className="divide-y divide-[#e0f2f0]">
                  {order.orderItems.map(item => (
                    <div key={item.orderItemId} className="flex items-start justify-between gap-3 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="break-words font-medium">{item.product?.productName || item.productId}</p>
                        <p className="mt-1 text-[#5a8a87]">{item.quantity} × {money(item.unitPrice)}</p>
                      </div>
                      <span className="shrink-0 font-semibold">{money(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-between gap-3 border-t border-[#e0f2f0] pt-4 font-semibold">
                  <span>{t("cart_total")}</span><span className="text-[#089D97]">{money(order.totalPrice)}</span>
                </div>
              </section>
              <section className="min-w-0 rounded-[18px] bg-white p-4 sm:p-6 shadow-sm">
                <h2 className="mb-4 font-semibold text-[#1a2e2d]">{t("cart_delivery_title")}</h2>
                <dl className="space-y-3 text-sm">
                  {([
                    ["cart_recipient_name", order.recipientName], ["cart_phone_number", order.phoneNumber],
                    ["cart_address_line", order.addressLine], ["cart_city", order.city],
                    ["cart_postal_code", order.postalCode], ["cart_delivery_notes", order.deliveryNotes],
                  ] as const).map(([label, value]) => (
                    <div key={label}><dt className="text-[#5a8a87]">{t(label)}</dt><dd className="mt-1 whitespace-pre-wrap break-words">{value || "—"}</dd></div>
                  ))}
                </dl>
              </section>
            </div>
            {order.orderStatus === "PENDING" ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                <button disabled={busy} onClick={() => void changeOrder("pay")} className={`${buttonClass} bg-[#089D97] text-white hover:bg-[#047975]`}>{t(busy ? "order_processing" : "order_pay")}</button>
                <button disabled={busy} onClick={() => setConfirmCancel(true)} className={`${buttonClass} border border-red-300 bg-white text-red-700 hover:bg-red-50`}>{t("order_cancel")}</button>
              </div>
            ) : <button onClick={() => onNavigate(order.orderStatus === "CANCELED" ? "cart" : "shop")} className={`${buttonClass} bg-[#089D97] text-white`}>{t(order.orderStatus === "CANCELED" ? "order_back_cart" : "cart_continue")}</button>}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState icon={<PackageCheck size={36} />} title={t("orders_empty_title")} description={t("order_history_empty")} actionLabel={t("cart_browse_shop")} onAction={() => onNavigate("shop")} />
        ) : (
          <div className="space-y-4">
            {orders.map(value => (
              <article key={value.orderId} className="rounded-[18px] bg-white p-4 sm:p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-[#5a8a87]">{new Date(value.createdAt).toLocaleDateString(lang)}</p>{status(value)}</div>
                <p className="mt-3 break-all text-sm">{t("cart_order_reference")}: {value.orderReference}</p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><strong className="text-[#089D97]">{money(value.totalPrice)}</strong><button onClick={() => onNavigate("orders", { orderId: value.orderId })} className={`${buttonClass} bg-[#e0f2f0] text-[#047975]`}>{t("orders_view_details")}</button></div>
              </article>
            ))}
          </div>
        )}
      </div>
      <Modal title={t("order_cancel")} open={confirmCancel} onClose={() => { if (!busy) setConfirmCancel(false); }} onConfirm={() => void changeOrder("cancel")} confirmLabel={t("order_cancel")} confirmDestructive confirmDisabled={busy}>
        <p className="text-sm text-[#1a2e2d]">{t("order_cancel_confirm")}</p>
      </Modal>
    </DashboardLayout>
  );
}
