import { Bell, Heart, MessageCircle, PawPrint, ShoppingCart, ClipboardList } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useLanguage } from "../../context/LanguageContext";

interface AdopterDashboardPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

export default function AdopterDashboardPage({ onNavigate }: AdopterDashboardPageProps) {
  const { user } = useAuth();
  const { count } = useCart();
  const { t } = useLanguage();

  const firstName = user?.name?.split(" ")[0] || t("profile_guest");
  const actions = [
    { label: t("nav_pets"), desc: t("adopter_action_pets_desc"), page: "pets", icon: PawPrint },
    { label: t("nav_my_requests"), desc: t("adopter_action_requests_desc"), page: "my-requests", icon: ClipboardList },
    { label: "Community", desc: "Share pet questions and photos with the community.", page: "community", icon: MessageCircle },
    { label: t("nav_my_adoptions"), desc: t("adopter_action_adoptions_desc"), page: "my-adoptions", icon: Heart },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-[20px] bg-gradient-to-br from-[#047975] to-[#089D97] px-6 py-7 text-white shadow-sm">
        <p className="font-['Poppins',sans-serif] text-[13px] text-white/75">{t("adopter_dash_crumb")}</p>
        <h1 className="mt-1 font-['Prata',serif] text-[34px] leading-tight">{t("adopter_welcome").replace("{name}", firstName)}</h1>
        <p className="mt-3 max-w-2xl font-['Poppins',sans-serif] text-[14px] leading-relaxed text-white/85">
          {t("adopter_intro")}
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => onNavigate("pets")} className="rounded-[16px] bg-white p-5 text-start shadow-sm transition-shadow hover:shadow-md">
          <PawPrint size={22} className="text-[#089D97]" />
          <p className="mt-3 font-['Poppins',sans-serif] text-[12px] text-[#5a8a87]">{t("adopter_next_step")}</p>
          <p className="font-['Poppins',sans-serif] font-semibold text-[16px] text-[#1a2e2d]">{t("adopter_find_pet")}</p>
        </button>
        <button onClick={() => onNavigate("cart")} className="rounded-[16px] bg-white p-5 text-start shadow-sm transition-shadow hover:shadow-md">
          <ShoppingCart size={22} className="text-[#089D97]" />
          <p className="mt-3 font-['Poppins',sans-serif] text-[12px] text-[#5a8a87]">{t("cart_title")}</p>
          <p className="font-['Poppins',sans-serif] font-semibold text-[16px] text-[#1a2e2d]">{t(count === 1 ? "adopter_cart_item" : "adopter_cart_items").replace("{count}", String(count))}</p>
        </button>
        <button onClick={() => onNavigate("notifications")} className="rounded-[16px] bg-white p-5 text-start shadow-sm transition-shadow hover:shadow-md">
          <Bell size={22} className="text-[#089D97]" />
          <p className="mt-3 font-['Poppins',sans-serif] text-[12px] text-[#5a8a87]">{t("adopter_updates")}</p>
          <p className="font-['Poppins',sans-serif] font-semibold text-[16px] text-[#1a2e2d]">{t("adopter_open_notifications")}</p>
        </button>
      </div>

      <section className="rounded-[20px] bg-white p-5 shadow-sm">
        <h2 className="font-['Poppins',sans-serif] font-semibold text-[17px] text-[#1a2e2d]">{t("adopter_quick_actions")}</h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map(({ label, desc, page, icon: Icon }) => (
            <button key={page} onClick={() => onNavigate(page)} className="flex items-start gap-3 rounded-[14px] bg-[#f0f8f7] p-4 text-start transition-colors hover:bg-[#e0f2f0]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white text-[#089D97]">
                <Icon size={18} />
              </span>
              <span>
                <span className="block font-['Poppins',sans-serif] font-semibold text-[14px] text-[#1a2e2d]">{label}</span>
                <span className="mt-1 block font-['Poppins',sans-serif] text-[12px] leading-relaxed text-[#5a8a87]">{desc}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
