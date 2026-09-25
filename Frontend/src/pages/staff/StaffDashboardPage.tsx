import { Heart, ClipboardList, ShoppingCart, MessageCircle } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import KpiCard from "../../components/KpiCard";
import Badge, { statusBadge } from "../../components/Badge";
import { useLanguage } from "../../context/LanguageContext";

const recentRequests = [
  { id: 1, adopter: "Roaa A.", pet: "Golden Retriever", submitted: "2026-07-10", status: "pending" },
  { id: 2, adopter: "Ali M.", pet: "Persian Cat", submitted: "2026-07-09", status: "approved" },
  { id: 3, adopter: "Sara K.", pet: "Rabbit (Lola)", submitted: "2026-07-08", status: "rejected" },
  { id: 4, adopter: "Lara B.", pet: "Poodle", submitted: "2026-07-07", status: "pending" },
];

interface StaffDashboardPageProps { onNavigate: (page: string) => void; }

export default function StaffDashboardPage({ onNavigate }: StaffDashboardPageProps) {
  const { t } = useLanguage();
  return (
    <DashboardLayout role="employee" activePage="staff-dashboard" onNavigate={onNavigate} pageTitle={t("staff_dashboard_title")} breadcrumbs={[t("role_employee"), t("nav_dashboard")]}>
      {/* KPIs */}
      <div className="flex flex-wrap gap-4 mb-6">
        <KpiCard label={t("kpi_available_pets")} value={42} icon={<Heart size={20} />} trend={5} trendLabel={t("trend_vs_last_month")} />
        <KpiCard label={t("kpi_pending_requests")} value={8} icon={<ClipboardList size={20} />} trend={-2} trendLabel={t("trend_vs_last_week")} accent="bg-yellow-50" />
        <KpiCard label={t("staff_active_adoptions")} value={17} icon={<ShoppingCart size={20} />} trend={12} trendLabel={t("misc_this_month")} accent="bg-green-50" />
        <KpiCard label={t("staff_open_chats")} value={4} icon={<MessageCircle size={20} />} accent="bg-blue-50" />
      </div>

      {/* Recent requests */}
      <div className="bg-white rounded-[15px] shadow-md p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black">{t("staff_recent_requests")}</h3>
          <button onClick={() => onNavigate("staff-requests")} className="font-['Poppins',sans-serif] text-[13px] text-[#089D97] hover:underline">{t("dash_view_all")}</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead>
              <tr className="border-b border-gray-100">
                {[t("th_adopter"), t("th_pet"), t("th_submitted"), t("th_status"), t("th_action")].map((h) => (
                  <th key={h} className="py-2.5 px-3 font-['Poppins',sans-serif] font-semibold text-[11px] text-black/50 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentRequests.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-[rgba(8,157,151,0.03)] transition-colors">
                  <td className="py-3 px-3 font-['Poppins',sans-serif] font-medium text-[13px] text-black">{r.adopter}</td>
                  <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{r.pet}</td>
                  <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/60">{r.submitted}</td>
                  <td className="py-3 px-3"><Badge label={r.status} variant={statusBadge(r.status)} /></td>
                  <td className="py-3 px-3">
                    <button onClick={() => onNavigate("staff-requests")} className="font-['Poppins',sans-serif] text-[12px] text-[#089D97] hover:underline">{t("action_review")}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-[15px] shadow-md p-5">
        <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black mb-4">{t("dash_quick_actions")}</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { label: t("staff_add_new_pet"), page: "staff-pets" },
            { label: t("staff_review_requests"), page: "staff-requests" },
            { label: t("staff_view_adoptions"), page: "staff-adoptions" },
            { label: t("staff_open_chats"), page: "staff-chats" },
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => onNavigate(a.page)}
              className="px-5 py-2.5 bg-[rgba(8,157,151,0.1)] text-[#089D97] font-['Poppins',sans-serif] font-medium text-[13px] rounded-[10px] hover:bg-[rgba(8,157,151,0.2)] transition-colors"
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
