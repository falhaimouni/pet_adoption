import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import type { OrderDto } from "@shared/dto/order.dto";
import Navbar from "../components/Navbar";
import EmptyState from "../components/EmptyState";
import { useCart } from "../context/CartContext";
import { defaultSupplyImage } from "../data/products";
import { useLanguage } from "../context/LanguageContext";
import { apiFetch } from "../lib/api";
import AuthenticatedImage from "../components/AuthenticatedImage";

interface CartPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
  embedded?: boolean;
}

interface CheckoutForm {
  recipientName: string;
  phoneNumber: string;
  addressLine: string;
  city: string;
  postalCode: string;
  deliveryNotes: string;
}

const initialCheckoutForm: CheckoutForm = {
  recipientName: "",
  phoneNumber: "",
  addressLine: "",
  city: "",
  postalCode: "",
  deliveryNotes: "",
};

export default function CartPage({ onNavigate, embedded = false }: CartPageProps) {
  const { items, total, count, loading, error: cartError, updateQuantity, removeFromCart, clearCart, refreshCart } = useCart();
  const { t } = useLanguage();
  const [mutationError, setMutationError] = useState("");
  const [savingProductId, setSavingProductId] = useState("");
  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>(initialCheckoutForm);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [completedOrderId, setCompletedOrderId] = useState("");
  const shipping = 0;
  const grandTotal = total + shipping;

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  async function mutate(productId: string, action: () => Promise<void>) {
    setSavingProductId(productId);
    setMutationError("");
    setCheckoutError("");
    setCompletedOrderId("");
    try {
      await action();
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "Unable to update cart.");
    } finally {
      setSavingProductId("");
    }
  }

  async function clear() {
    setSavingProductId("cart");
    setMutationError("");
    setCheckoutError("");
    setCompletedOrderId("");
    try {
      await clearCart();
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "Unable to clear cart.");
    } finally {
      setSavingProductId("");
    }
  }

  function updateCheckoutField(field: keyof CheckoutForm, value: string) {
    setCheckoutForm((form) => ({ ...form, [field]: value }));
    setCheckoutError("");
  }

  function buildCheckoutPayload() {
    return {
      recipientName: checkoutForm.recipientName.trim(),
      phoneNumber: checkoutForm.phoneNumber.trim(),
      addressLine: checkoutForm.addressLine.trim(),
      city: checkoutForm.city.trim(),
      ...(checkoutForm.postalCode.trim() ? { postalCode: checkoutForm.postalCode.trim() } : {}),
      ...(checkoutForm.deliveryNotes.trim() ? { deliveryNotes: checkoutForm.deliveryNotes.trim() } : {}),
    };
  }

  async function submitCheckout() {
    const payload = buildCheckoutPayload();
    if (!payload.recipientName || !payload.phoneNumber || !payload.addressLine || !payload.city) {
      setCheckoutError(t("cart_checkout_required"));
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError("");
    setMutationError("");
    setCompletedOrderId("");

    try {
      const order = await apiFetch<OrderDto>("/checkout", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const paidOrder = await apiFetch<OrderDto>(`/checkout/${order.orderId}/pay`, { method: "POST" });
      setCompletedOrderId(paidOrder.orderId);
      setCheckoutForm(initialCheckoutForm);
      await refreshCart();
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : t("cart_checkout_error"));
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div className={embedded ? "" : "min-h-screen bg-[#f0f8f7]"}>
      {!embedded && <Navbar onNavigate={onNavigate} activePage="cart" />}

      <main className="max-w-6xl mx-auto px-5 pt-6 pb-16">
        <button onClick={() => onNavigate("shop")} className="flex items-center gap-1.5 font-['Poppins',sans-serif] text-[13px] text-[#5a8a87] hover:text-[#089D97] transition-colors group mb-6">
          <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" /> {t("cart_continue")}
        </button>

        {loading ? (
          <div className="grid lg:grid-cols-[1fr_340px] gap-6">
            <div className="h-[320px] rounded-[18px] bg-white animate-pulse" />
            <div className="h-[260px] rounded-[18px] bg-white animate-pulse" />
          </div>
        ) : cartError && items.length === 0 ? (
          <EmptyState icon={<ShoppingCart size={36} />} title={t("cart_load_error")} description={cartError} actionLabel={t("common_try_again")} onAction={refreshCart} />
        ) : completedOrderId ? (
          <EmptyState
            icon={<CheckCircle2 size={36} />}
            title={t("cart_order_placed")}
            description={`${t("cart_order_desc")} ${t("cart_order_reference")}: ${completedOrderId}`}
            actionLabel={t("cart_browse_shop")}
            onAction={() => onNavigate("shop")}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart size={36} />}
            title={t("cart_empty")}
            description={t("cart_empty_desc")}
            actionLabel={t("cart_browse_shop")}
            onAction={() => onNavigate("shop")}
          />
        ) : (
          <div className="grid lg:grid-cols-[1fr_340px] gap-6">
            <section className="bg-white rounded-[18px] shadow-sm p-5">
              <div className="flex items-center justify-between mb-5">
                <h1 className="font-['Prata',serif] text-[30px] text-[#1a2e2d]">{t("cart_title")}</h1>
                <span className="font-['Poppins',sans-serif] text-[13px] text-[#5a8a87]">{count} {count === 1 ? t("cart_items") : t("cart_items_pl")}</span>
              </div>
              {(mutationError || cartError) && <p className="mb-4 rounded-[10px] bg-red-50 border border-red-100 px-3 py-2 font-['Poppins',sans-serif] text-[12px] text-red-700">{mutationError || cartError}</p>}
              <div className="divide-y divide-[#f0f8f7]">
                {items.map(({ product, quantity }) => (
                  <article key={product.id} className="py-4 flex gap-4">
                    <AuthenticatedImage
                      src={product.image}
                      fallback={defaultSupplyImage}
                      alt={product.name}
                      className="w-20 h-20 rounded-[14px] object-cover bg-[#f0f8f7] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-['Poppins',sans-serif] text-[11px] text-[#5a8a87]">{product.brand}</p>
                      <h2 className="font-['Poppins',sans-serif] font-semibold text-[15px] text-[#1a2e2d] truncate">{product.name}</h2>
                      <p className="font-['Poppins',sans-serif] font-bold text-[15px] text-[#089D97] mt-1">${product.price.toFixed(2)}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => mutate(String(product.id), () => updateQuantity(product.id, quantity - 1))}
                          disabled={checkoutLoading || savingProductId === String(product.id)}
                          className="w-8 h-8 rounded-[9px] bg-[#f0f8f7] text-[#047975] flex items-center justify-center hover:bg-[#e0f2f0] disabled:opacity-50"
                          aria-label={`Decrease ${product.name}`}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center font-['Poppins',sans-serif] text-[13px] font-semibold">{quantity}</span>
                        <button
                          onClick={() => mutate(String(product.id), () => updateQuantity(product.id, quantity + 1))}
                          disabled={checkoutLoading || savingProductId === String(product.id)}
                          className="w-8 h-8 rounded-[9px] bg-[#f0f8f7] text-[#047975] flex items-center justify-center hover:bg-[#e0f2f0] disabled:opacity-50"
                          aria-label={`Increase ${product.name}`}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => mutate(String(product.id), () => removeFromCart(product.id))}
                      disabled={checkoutLoading || savingProductId === String(product.id)}
                      aria-label={t("cart_remove_item")}
                      className="w-9 h-9 rounded-[10px] text-rose-500 hover:bg-rose-50 flex items-center justify-center shrink-0 disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </article>
                ))}
              </div>

              <div className="mt-6 border-t border-[#f0f8f7] pt-5">
                <h2 className="font-['Poppins',sans-serif] font-semibold text-[18px] text-[#1a2e2d]">{t("cart_delivery_title")}</h2>
                <p className="mt-1 font-['Poppins',sans-serif] text-[12px] text-[#5a8a87]">{t("cart_delivery_desc")}</p>
                {checkoutError && <p className="mt-4 rounded-[10px] bg-red-50 border border-red-100 px-3 py-2 font-['Poppins',sans-serif] text-[12px] text-red-700">{checkoutError}</p>}
                <div className="mt-4 grid sm:grid-cols-2 gap-4">
                  <CheckoutField label={t("cart_recipient_name")} value={checkoutForm.recipientName} onChange={(value) => updateCheckoutField("recipientName", value)} required />
                  <CheckoutField label={t("cart_phone_number")} value={checkoutForm.phoneNumber} onChange={(value) => updateCheckoutField("phoneNumber", value)} required />
                  <CheckoutField label={t("cart_address_line")} value={checkoutForm.addressLine} onChange={(value) => updateCheckoutField("addressLine", value)} required className="sm:col-span-2" />
                  <CheckoutField label={t("cart_city")} value={checkoutForm.city} onChange={(value) => updateCheckoutField("city", value)} required />
                  <CheckoutField label={t("cart_postal_code")} value={checkoutForm.postalCode} onChange={(value) => updateCheckoutField("postalCode", value)} />
                  <label className="sm:col-span-2">
                    <span className="font-['Poppins',sans-serif] text-[12px] font-medium text-[#1a2e2d]">{t("cart_delivery_notes")}</span>
                    <textarea
                      value={checkoutForm.deliveryNotes}
                      onChange={(event) => updateCheckoutField("deliveryNotes", event.target.value)}
                      rows={3}
                      className="mt-1 w-full resize-none rounded-[10px] border border-[#d8e9e7] px-3 py-2 font-['Poppins',sans-serif] text-[13px] text-[#1a2e2d] outline-none transition-colors focus:border-[#089D97]"
                    />
                  </label>
                </div>
              </div>
            </section>

            <aside className="bg-white rounded-[18px] shadow-sm p-5 h-fit lg:sticky lg:top-24">
              <h2 className="font-['Poppins',sans-serif] font-semibold text-[18px] text-[#1a2e2d] mb-4">{t("cart_summary")}</h2>
              <div className="space-y-3 font-['Poppins',sans-serif] text-[13px]">
                <SummaryRow label={t("cart_subtotal")} value={`$${total.toFixed(2)}`} />
                <SummaryRow label={t("cart_shipping")} value={t("cart_free")} />
                <div className="border-t border-[#f0f8f7] pt-3 flex items-center justify-between">
                  <span className="font-semibold text-[#1a2e2d]">{t("cart_total")}</span>
                  <span className="font-bold text-[20px] text-[#089D97]">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4 rounded-[12px] bg-[#f0f8f7] px-3 py-3">
                <p className="font-['Poppins',sans-serif] text-[12px] font-semibold text-[#1a2e2d]">{t("cart_cash_title")}</p>
                <p className="mt-1 font-['Poppins',sans-serif] text-[11px] text-[#5a8a87]">{t("cart_cash_desc")}</p>
              </div>

              <button onClick={submitCheckout} disabled={checkoutLoading || loading || savingProductId !== ""} className="mt-5 w-full py-3 rounded-[12px] bg-[#089D97] text-white font-['Poppins',sans-serif] font-semibold text-[14px] hover:bg-[#047975] transition-colors disabled:opacity-60">
                {checkoutLoading ? t("cart_checkout_processing") : t("cart_place_cash_order")}
              </button>
              <button onClick={clear} disabled={checkoutLoading || savingProductId === "cart"} className="mt-3 w-full py-3 rounded-[12px] border border-[#089D97] text-[#089D97] font-['Poppins',sans-serif] font-semibold text-[14px] hover:bg-[#e0f2f0] transition-colors disabled:opacity-60">
                {t("cart_clear")}
              </button>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

function CheckoutField({ label, value, onChange, required = false, className = "" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; className?: string }) {
  return (
    <label className={className}>
      <span className="font-['Poppins',sans-serif] text-[12px] font-medium text-[#1a2e2d]">
        {label}{required ? " *" : ""}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-[10px] border border-[#d8e9e7] px-3 py-2 font-['Poppins',sans-serif] text-[13px] text-[#1a2e2d] outline-none transition-colors focus:border-[#089D97]"
      />
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[#5a8a87]">
      <span>{label}</span>
      <span className="font-semibold text-[#1a2e2d]">{value}</span>
    </div>
  );
}
