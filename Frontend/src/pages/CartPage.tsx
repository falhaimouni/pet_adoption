import { useState } from "react";
import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2, CheckCircle } from "lucide-react";
import Navbar from "../components/Navbar";
import EmptyState from "../components/EmptyState";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";

interface CartPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

export default function CartPage({ onNavigate }: CartPageProps) {
  const { items, total, count, updateQuantity, removeFromCart, clearCart } = useCart();
  const { t } = useLanguage();
  const [promo, setPromo] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoError, setPromoError] = useState("");
  const [placed, setPlaced] = useState(false);
  const shipping = total >= 50 || total === 0 ? 0 : 4.99;
  const grandTotal = Math.max(0, total - discount + shipping);

  function applyPromo() {
    const code = promo.trim().toUpperCase();
    if (code === "PETOPIA10") {
      setDiscount(total * 0.1);
      setPromoError("");
      return;
    }
    setDiscount(0);
    setPromoError(t("cart_invalid_promo"));
  }

  function checkout() {
    setPlaced(true);
    clearCart();
  }

  return (
    <div className="min-h-screen bg-[#f0f8f7]">
      <Navbar onNavigate={onNavigate} activePage="cart" />

      <main className="max-w-6xl mx-auto px-5 pt-6 pb-16">
        <button onClick={() => onNavigate("shop")} className="flex items-center gap-1.5 font-['Poppins',sans-serif] text-[13px] text-[#5a8a87] hover:text-[#089D97] transition-colors group mb-6">
          <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" /> {t("cart_continue")}
        </button>

        {placed ? (
          <EmptyState
            icon={<CheckCircle size={38} />}
            title={t("cart_order_placed")}
            description={t("cart_order_desc")}
            actionLabel={t("cart_browse_shop")}
            onAction={() => { setPlaced(false); onNavigate("shop"); }}
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
              <div className="divide-y divide-[#f0f8f7]">
                {items.map(({ product, quantity }) => (
                  <article key={product.id} className="py-4 flex gap-4">
                    <img src={product.image} alt={product.name} className="w-20 h-20 rounded-[14px] object-cover bg-[#f0f8f7] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-['Poppins',sans-serif] text-[11px] text-[#5a8a87]">{product.brand}</p>
                      <h2 className="font-['Poppins',sans-serif] font-semibold text-[15px] text-[#1a2e2d] truncate">{product.name}</h2>
                      <p className="font-['Poppins',sans-serif] font-bold text-[15px] text-[#089D97] mt-1">${product.price.toFixed(2)}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <button onClick={() => updateQuantity(product.id, quantity - 1)} className="w-8 h-8 rounded-[9px] bg-[#f0f8f7] text-[#047975] flex items-center justify-center hover:bg-[#e0f2f0]"><Minus size={14} /></button>
                        <span className="w-8 text-center font-['Poppins',sans-serif] text-[13px] font-semibold">{quantity}</span>
                        <button onClick={() => updateQuantity(product.id, quantity + 1)} className="w-8 h-8 rounded-[9px] bg-[#f0f8f7] text-[#047975] flex items-center justify-center hover:bg-[#e0f2f0]"><Plus size={14} /></button>
                      </div>
                    </div>
                    <button onClick={() => removeFromCart(product.id)} aria-label="Remove item" className="w-9 h-9 rounded-[10px] text-rose-500 hover:bg-rose-50 flex items-center justify-center shrink-0">
                      <Trash2 size={16} />
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <aside className="bg-white rounded-[18px] shadow-sm p-5 h-fit lg:sticky lg:top-24">
              <h2 className="font-['Poppins',sans-serif] font-semibold text-[18px] text-[#1a2e2d] mb-4">{t("cart_summary")}</h2>
              <div className="space-y-3 font-['Poppins',sans-serif] text-[13px]">
                <SummaryRow label={t("cart_subtotal")} value={`$${total.toFixed(2)}`} />
                <SummaryRow label={t("cart_discount")} value={`-$${discount.toFixed(2)}`} />
                <SummaryRow label={t("cart_shipping")} value={shipping === 0 ? t("cart_free") : `$${shipping.toFixed(2)}`} />
                <div className="border-t border-[#f0f8f7] pt-3 flex items-center justify-between">
                  <span className="font-semibold text-[#1a2e2d]">{t("cart_total")}</span>
                  <span className="font-bold text-[20px] text-[#089D97]">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-5">
                <label className="block font-['Poppins',sans-serif] text-[12px] text-[#5a8a87] mb-1">{t("cart_promo")}</label>
                <div className="flex gap-2">
                  <input value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="PETOPIA10" className="min-w-0 flex-1 rounded-[10px] bg-[#f0f8f7] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:ring-1 focus:ring-[#089D97]" />
                  <button onClick={applyPromo} className="px-3 py-2 rounded-[10px] bg-[#e0f2f0] text-[#047975] font-['Poppins',sans-serif] text-[12px] font-semibold">{t("cart_apply")}</button>
                </div>
                {promoError && <p className="mt-2 text-[12px] text-rose-600 font-['Poppins',sans-serif]">{promoError}</p>}
                {discount > 0 && <p className="mt-2 text-[12px] text-emerald-700 font-['Poppins',sans-serif]">PETOPIA10 {t("cart_applied")} · 10% {t("cart_off")}</p>}
              </div>

              <button onClick={checkout} className="mt-5 w-full py-3 rounded-[12px] bg-[#089D97] text-white font-['Poppins',sans-serif] font-semibold text-[14px] hover:bg-[#047975] transition-colors">
                {t("cart_checkout")}
              </button>
              <p className="mt-3 text-center font-['Poppins',sans-serif] text-[11px] text-[#5a8a87]">{t("cart_free_msg")}</p>
            </aside>
          </div>
        )}
      </main>
    </div>
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
