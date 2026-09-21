import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import type { OrderDto } from "@shared/dto/order.dto";
import Navbar from "../components/Navbar";
import EmptyState from "../components/EmptyState";
import { useCart } from "../context/CartContext";
import { defaultSupplyImage } from "../data/products";
import { useLanguage } from "../context/LanguageContext";
import { apiFetch } from "../lib/api";
import AuthenticatedImage from "../components/AuthenticatedImage";
import { checkoutLimits, validateCheckout, type CheckoutForm, type CheckoutErrors } from "../lib/checkoutValidation";

interface CartPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
  embedded?: boolean;
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
  const [fieldErrors, setFieldErrors] = useState<CheckoutErrors>({});
  const checkoutInFlight = useRef(false);
  const shipping = 0;
  const grandTotal = total + shipping;

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  async function mutate(productId: string, action: () => Promise<void>) {
    setSavingProductId(productId);
    setMutationError("");
    setCheckoutError("");
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
    try {
      await clearCart();
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "Unable to clear cart.");
    } finally {
      setSavingProductId("");
    }
  }

  function updateCheckoutField(field: keyof CheckoutForm, value: string) {
    const next = { ...checkoutForm, [field]: value };
    setCheckoutForm(next);
    if (fieldErrors[field]) setFieldErrors((errors) => ({ ...errors, [field]: validateCheckout(next, t)[field] }));
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
    if (checkoutInFlight.current || loading || savingProductId || !items.length) return;
    const errors = validateCheckout(checkoutForm, t);
    setFieldErrors(errors);
    const firstInvalid = Object.keys(errors)[0];
    if (firstInvalid) {
      document.getElementById(`checkout-${firstInvalid}`)?.focus();
      return;
    }
    if (items.some(({ quantity, product }) => !Number.isSafeInteger(quantity) || quantity < 1 || !product.inStock)) {
      setCheckoutError(t("checkout_cart_invalid"));
      return;
    }
    const payload = buildCheckoutPayload();
    checkoutInFlight.current = true;

    setCheckoutLoading(true);
    setCheckoutError("");
    setMutationError("");

    try {
      const order = await apiFetch<OrderDto>("/checkout", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      onNavigate("orders", { orderId: order.orderId });
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : t("cart_checkout_error"));
    } finally {
      checkoutInFlight.current = false;
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
                          disabled={checkoutLoading || savingProductId !== ""}
                          className="w-8 h-8 rounded-[9px] bg-[#f0f8f7] text-[#047975] flex items-center justify-center hover:bg-[#e0f2f0] disabled:opacity-50"
                          aria-label={`Decrease ${product.name}`}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center font-['Poppins',sans-serif] text-[13px] font-semibold">{quantity}</span>
                        <button
                          onClick={() => mutate(String(product.id), () => updateQuantity(product.id, quantity + 1))}
                          disabled={checkoutLoading || savingProductId !== ""}
                          className="w-8 h-8 rounded-[9px] bg-[#f0f8f7] text-[#047975] flex items-center justify-center hover:bg-[#e0f2f0] disabled:opacity-50"
                          aria-label={`Increase ${product.name}`}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => mutate(String(product.id), () => removeFromCart(product.id))}
                      disabled={checkoutLoading || savingProductId !== ""}
                      aria-label={t("cart_remove_item")}
                      className="w-9 h-9 rounded-[10px] text-rose-500 hover:bg-rose-50 flex items-center justify-center shrink-0 disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </article>
                ))}
              </div>

              <form id="checkout-delivery-form" noValidate onSubmit={(event) => { event.preventDefault(); void submitCheckout(); }} className="mt-6 border-t border-[#f0f8f7] pt-5">
                <h2 className="font-['Poppins',sans-serif] font-semibold text-[18px] text-[#1a2e2d]">{t("cart_delivery_title")}</h2>
                <p className="mt-1 font-['Poppins',sans-serif] text-[12px] text-[#5a8a87]">{t("cart_delivery_desc")}</p>
                {checkoutError && <p className="mt-4 rounded-[10px] bg-red-50 border border-red-100 px-3 py-2 font-['Poppins',sans-serif] text-[12px] text-red-700">{checkoutError}</p>}
                <fieldset disabled={checkoutLoading} className="mt-4 grid sm:grid-cols-2 gap-4">
                  {(["recipientName", "phoneNumber", "addressLine", "city", "postalCode"] as const).map((field) => (
                    <CheckoutField
                      key={field}
                      id={`checkout-${field}`}
                      label={t({ recipientName: "cart_recipient_name", phoneNumber: "cart_phone_number", addressLine: "cart_address_line", city: "cart_city", postalCode: "cart_postal_code" }[field])}
                      value={checkoutForm[field]}
                      onChange={(value) => updateCheckoutField(field, value)}
                      onBlur={() => setFieldErrors((errors) => ({ ...errors, [field]: validateCheckout(checkoutForm, t)[field] }))}
                      required={field !== "postalCode"}
                      maxLength={checkoutLimits[field]}
                      error={fieldErrors[field]}
                      type={field === "phoneNumber" ? "tel" : "text"}
                      autoComplete={{ recipientName: "name", phoneNumber: "tel", addressLine: "street-address", city: "address-level2", postalCode: "postal-code" }[field]}
                      className={field === "addressLine" ? "sm:col-span-2" : ""}
                    />
                  ))}
                  <label className="sm:col-span-2" htmlFor="checkout-deliveryNotes">
                    <span className="font-['Poppins',sans-serif] text-[12px] font-medium text-[#1a2e2d]">{t("cart_delivery_notes")}</span>
                    <textarea
                      id="checkout-deliveryNotes"
                      name="deliveryNotes"
                      value={checkoutForm.deliveryNotes}
                      onChange={(event) => updateCheckoutField("deliveryNotes", event.target.value)}
                      onBlur={() => setFieldErrors((errors) => ({ ...errors, deliveryNotes: validateCheckout(checkoutForm, t).deliveryNotes }))}
                      maxLength={checkoutLimits.deliveryNotes}
                      aria-invalid={!!fieldErrors.deliveryNotes}
                      aria-describedby={fieldErrors.deliveryNotes ? "checkout-deliveryNotes-error" : undefined}
                      rows={3}
                      className="mt-1 w-full resize-none rounded-[10px] border border-[#d8e9e7] px-3 py-2 font-['Poppins',sans-serif] text-[13px] text-[#1a2e2d] outline-none transition-colors focus:border-[#089D97]"
                    />
                    <span className="text-xs text-[#5a8a87]">{checkoutForm.deliveryNotes.length}/{checkoutLimits.deliveryNotes}</span>
                    {fieldErrors.deliveryNotes && <p id="checkout-deliveryNotes-error" className="text-xs text-red-700" role="alert">{fieldErrors.deliveryNotes}</p>}
                  </label>
                </fieldset>
              </form>
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

              <button type="submit" form="checkout-delivery-form" disabled={checkoutLoading || loading || savingProductId !== ""} className="mt-5 w-full py-3 rounded-[12px] bg-[#089D97] text-white font-['Poppins',sans-serif] font-semibold text-[14px] hover:bg-[#047975] transition-colors disabled:opacity-60">
                {checkoutLoading ? t("cart_checkout_processing") : t("order_review")}
              </button>
              <button onClick={clear} disabled={checkoutLoading || savingProductId !== ""} className="mt-3 w-full py-3 rounded-[12px] border border-[#089D97] text-[#089D97] font-['Poppins',sans-serif] font-semibold text-[14px] hover:bg-[#e0f2f0] transition-colors disabled:opacity-60">
                {t("cart_clear")}
              </button>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

function CheckoutField({ id, label, value, onChange, onBlur, required = false, className = "", maxLength, error, type, autoComplete }: {
  id: string; label: string; value: string; onChange: (value: string) => void; onBlur: () => void;
  required?: boolean; className?: string; maxLength: number; error?: string; type: string; autoComplete: string;
}) {
  return (
    <label className={className} htmlFor={id}>
      <span className="font-['Poppins',sans-serif] text-[12px] font-medium text-[#1a2e2d]">{label}{required ? " *" : ""}</span>
      <input
        id={id}
        name={id.replace("checkout-", "")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        required={required}
        maxLength={maxLength}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`mt-1 w-full rounded-[10px] border ${error ? "border-red-500" : "border-[#d8e9e7]"} px-3 py-2 font-['Poppins',sans-serif] text-[13px] text-[#1a2e2d] outline-none transition-colors focus:border-[#089D97]`}
      />
      {error && <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-700">{error}</p>}
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
