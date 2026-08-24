import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Tag, CheckCircle } from "lucide-react";
import Navbar from "../components/Navbar";
import EmptyState from "../components/EmptyState";
import { useCart } from "../context/CartContext";
import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";

interface CartPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

const PROMO_CODES: Record<string, number> = {
  PETOPIA10: 10,
  ADOPT20: 20,
};

export default function CartPage({ onNavigate }: CartPageProps) {
  const { t } = useLanguage();
  const { items, total, updateQuantity, removeFromCart, clearCart } = useCart();
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState(false);
  const [checkoutDone, setCheckoutDone] = useState(false);

  const discount = appliedPromo ? PROMO_CODES[appliedPromo] : 0;
  const discountAmount = (total * discount) / 100;
  const shipping = total > 50 ? 0 : 4.99;
  const finalTotal = total - discountAmount + shipping;

  function applyPromo() {
    const code = promoInput.trim().toUpperCase();
    if (PROMO_CODES[code]) {
      setAppliedPromo(code);
      setPromoError(false);
    } else {
      setPromoError(true);
      setAppliedPromo(null);
    }
  }

  function checkout() {
    clearCart();
    setCheckoutDone(true);
  }

  if (checkoutDone) {
    return (
      <div className="min-h-screen bg-[#f0f8f7] flex flex-col">
        <Navbar onNavigate={onNavigate} />
        <div className="flex-1 flex items-center justify-center px-5">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 bg-[#e0f2f0] rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} className="text-[#089D97]" />
            </div>
            <h2 className="font-['Prata',serif] text-[28px] text-[#1a2e2d] mb-2">{t("cart_order_placed")}</h2>
            <p className="font-['Poppins',sans-serif] text-[14px] text-[#5a8a87] mb-6">{t("cart_order_desc")}</p>
            <button onClick={() => onNavigate("shop")} className="px-8 py-3 bg-[#089D97] text-white font-['Poppins',sans-serif] font-semibold rounded-[14px] hover:bg-[#047975] transition-colors">
              {t("cart_continue")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f8f7]">
      <Navbar onNavigate={onNavigate} />

      <div className="max-w-5xl mx-auto px-5 pt-6 pb-16">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => onNavigate("shop")} className="flex items-center gap-1.5 font-['Poppins',sans-serif] text-[13px] text-[#5a8a87] hover:text-[#089D97] transition-colors group">
            <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" /> {t("cart_continue")}
          </button>
          <span className="text-gray-200">|</span>
          <h1 className="font-['Poppins',sans-serif] font-semibold text-[22px] text-[#1a2e2d]">{t("cart_title")}</h1>
          {items.length > 0 && <span className="font-['Poppins',sans-serif] text-[14px] text-[#5a8a87]">({items.length} {items.length > 1 ? t("cart_items_pl") : t("cart_items")})</span>}
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart size={36} />}
            title={t("cart_empty")}
            description={t("cart_empty_desc")}
            actionLabel={t("cart_browse_shop")}
            onAction={() => onNavigate("shop")}
          />
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Items list */}
            <div className="flex-1 flex flex-col gap-3">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="bg-white rounded-[20px] shadow-sm p-4 flex gap-4 items-start">
                  <div className="w-[80px] h-[80px] bg-gray-50 rounded-[12px] overflow-hidden flex-shrink-0">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-['Poppins',sans-serif] text-[11px] text-[#5a8a87]">{product.brand}</p>
                    <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#1a2e2d] leading-snug">{product.name}</p>
                    {product.weight && <p className="font-['Poppins',sans-serif] text-[12px] text-[#5a8a87] mt-0.5">{product.weight}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 bg-[#f0f8f7] rounded-[10px] p-1">
                        <button onClick={() => updateQuantity(product.id, quantity - 1)} className="w-7 h-7 rounded-[8px] flex items-center justify-center hover:bg-[#e0f2f0] text-[#089D97] transition-colors">
                          <Minus size={13} />
                        </button>
                        <span className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#1a2e2d] w-6 text-center">{quantity}</span>
                        <button onClick={() => updateQuantity(product.id, quantity + 1)} className="w-7 h-7 rounded-[8px] flex items-center justify-center hover:bg-[#e0f2f0] text-[#089D97] transition-colors">
                          <Plus size={13} />
                        </button>
                      </div>
                      <p className="font-['Poppins',sans-serif] font-bold text-[16px] text-[#089D97]">
                        ${(product.price * quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(product.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}

              {/* Promo code */}
              <div className="bg-white rounded-[20px] shadow-sm p-4">
                <p className="font-['Poppins',sans-serif] font-semibold text-[13px] text-[#1a2e2d] mb-3 flex items-center gap-2">
                  <Tag size={14} className="text-[#089D97]" /> {t("cart_promo")}
                </p>
                <div className="flex gap-2">
                  <input
                    value={promoInput}
                    onChange={(e) => { setPromoInput(e.target.value); setPromoError(false); }}
                    placeholder="e.g. PETOPIA10"
                    className={`flex-1 border rounded-[12px] px-3.5 py-2.5 font-['Poppins',sans-serif] text-[13px] outline-none transition-all ${promoError ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-[#089D97]"}`}
                  />
                  <button onClick={applyPromo} className="px-4 py-2.5 bg-[#089D97] text-white font-['Poppins',sans-serif] font-medium text-[13px] rounded-[12px] hover:bg-[#047975] transition-colors whitespace-nowrap">
                    {t("cart_apply")}
                  </button>
                </div>
                {promoError && <p className="font-['Poppins',sans-serif] text-[12px] text-red-500 mt-1.5">{t("cart_invalid_promo")}</p>}
                {appliedPromo && <p className="font-['Poppins',sans-serif] text-[12px] text-emerald-600 mt-1.5 flex items-center gap-1"><CheckCircle size={12} /> {appliedPromo} {t("cart_applied")} — {discount}% {t("cart_off")}</p>}
                <p className="font-['Poppins',sans-serif] text-[11px] text-[#5a8a87] mt-2">{t("cart_try")} PETOPIA10 or ADOPT20</p>
              </div>
            </div>

            {/* Order summary */}
            <div className="lg:w-[300px] shrink-0">
              <div className="bg-white rounded-[24px] shadow-sm p-5 sticky top-4">
                <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-[#1a2e2d] mb-4">{t("cart_summary")}</h3>
                <div className="space-y-2.5 mb-4">
                  <div className="flex justify-between font-['Poppins',sans-serif] text-[14px]">
                    <span className="text-[#5a8a87]">{t("cart_subtotal")}</span>
                    <span className="font-medium text-[#1a2e2d]">${total.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between font-['Poppins',sans-serif] text-[14px]">
                      <span className="text-emerald-600">{t("cart_discount")} ({discount}%)</span>
                      <span className="font-medium text-emerald-600">-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-['Poppins',sans-serif] text-[14px]">
                    <span className="text-[#5a8a87]">{t("cart_shipping")}</span>
                    <span className={`font-medium ${shipping === 0 ? "text-emerald-600" : "text-[#1a2e2d]"}`}>
                      {shipping === 0 ? t("cart_free") : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <p className="font-['Poppins',sans-serif] text-[11px] text-[#5a8a87] bg-[#f0f8f7] rounded-[8px] px-2 py-1">
                      {t("cart_free_msg")}
                    </p>
                  )}
                </div>
                <div className="border-t border-gray-100 pt-3 mb-4">
                  <div className="flex justify-between font-['Poppins',sans-serif]">
                    <span className="font-semibold text-[16px] text-[#1a2e2d]">{t("cart_total")}</span>
                    <span className="font-bold text-[20px] text-[#089D97]">${finalTotal.toFixed(2)}</span>
                  </div>
                </div>
                <button onClick={checkout} className="w-full py-3.5 bg-[#089D97] text-white font-['Poppins',sans-serif] font-semibold text-[15px] rounded-[14px] hover:bg-[#047975] transition-colors shadow-md">
                  {t("cart_checkout")}
                </button>
                <button onClick={() => onNavigate("shop")} className="w-full mt-2.5 py-2.5 border-2 border-gray-200 text-[#5a8a87] font-['Poppins',sans-serif] font-medium text-[13px] rounded-[14px] hover:border-gray-300 transition-colors">
                  {t("cart_continue")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
