import { useEffect, useState } from "react";
import { AlertCircle, Bell, Check, CheckCheck, Heart, Info, Package } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { apiFetch } from "../lib/api";

type Role = "adopter" | "staff" | "vet" | "manager" | "admin";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

function iconFor(type: string) {
  switch (type.toUpperCase()) {
    case "ADOPTION": return <Heart size={16} className="text-[#089D97]" />;
    case "INVENTORY": return <Package size={16} className="text-amber-500" />;
    case "ALERT": return <AlertCircle size={16} className="text-yellow-500" />;
    default: return <Info size={16} className="text-gray-400" />;
  }
}

function bgFor(type: string) {
  switch (type.toUpperCase()) {
    case "ADOPTION": return "bg-[rgba(8,157,151,0.1)]";
    case "INVENTORY": return "bg-amber-50";
    case "ALERT": return "bg-yellow-50";
    default: return "bg-gray-100";
  }
}

interface NotificationsPageProps {
  onNavigate: (page: string) => void;
  role?: Role;
}

export default function NotificationsPage({ onNavigate, role }: NotificationsPageProps) {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const resolvedRole = role ?? user?.role ?? "adopter";
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    apiFetch<NotificationItem[]>("/notifications")
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : t("notif_load_error")))
      .finally(() => setLoading(false));
  }, [t]);

  const filters = [
    { key: "all", label: t("notif_all") },
    { key: "ADOPTION", label: t("notif_adoptions") },
    { key: "INVENTORY", label: t("notif_inventory") },
    { key: "SYSTEM", label: t("notif_system") },
  ];
  const locale = lang === "ar" ? "ar-JO" : "en-US";

  async function markRead(id: string) {
    const updated = await apiFetch<NotificationItem>(`/notifications/${id}/read`, { method: "PATCH" });
    setItems((prev) => prev.map((n) => n.id === id ? updated : n));
  }

  async function markAll() {
    await apiFetch("/notifications/read-all", { method: "PATCH" });
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  const filtered = items.filter((n) => filter === "all" || n.type.toUpperCase() === filter);
  const unread = filtered.filter((n) => !n.isRead);
  const read = filtered.filter((n) => n.isRead);
  const unreadTotal = items.filter((n) => !n.isRead).length;

  return (
    <DashboardLayout role={resolvedRole} activePage="notifications" onNavigate={onNavigate} pageTitle={t("notif_title")} breadcrumbs={[t("notif_title")]}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`px-3 py-1.5 rounded-[20px] font-['Poppins',sans-serif] text-[12px] transition-colors ${filter === f.key ? "bg-[#089D97] text-white" : "bg-white text-black/70 hover:bg-gray-100"}`}>{f.label}</button>
          ))}
        </div>
        {unreadTotal > 0 && (
          <button onClick={markAll} className="flex items-center gap-1.5 font-['Poppins',sans-serif] text-[12px] text-[#089D97] hover:underline">
            <CheckCheck size={14} /> {t("notif_mark_all")}
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((n) => <div key={n} className="h-[86px] rounded-[12px] bg-white animate-pulse" />)}
        </div>
      ) : error ? (
        <EmptyState icon={<Bell size={28} />} title={t("notif_load_error")} description={error} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Bell size={28} />} title={t("notif_none")} description={t("notif_caught_up")} />
      ) : (
        <div className="space-y-4">
          {unread.length > 0 && (
            <div>
              <p className="font-['Poppins',sans-serif] font-semibold text-[12px] text-black/40 uppercase tracking-wider mb-3">{t("notif_unread")} ({unread.length})</p>
              <div className="space-y-2">
                {unread.map((n) => (
                  <div key={n.id} className="bg-white rounded-[12px] shadow-sm border border-[rgba(8,157,151,0.2)] px-4 py-3 flex gap-3 items-start">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${bgFor(n.type)}`}>{iconFor(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black">{n.title}</p>
                      <p className="font-['Poppins',sans-serif] text-[12px] text-black/60 mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="font-['Poppins',sans-serif] text-[11px] text-black/35 mt-1">{new Date(n.createdAt).toLocaleString(locale)}</p>
                    </div>
                    <button onClick={() => markRead(n.id)} title={t("notif_mark_all")} className="w-7 h-7 rounded-full bg-[rgba(8,157,151,0.1)] text-[#089D97] flex items-center justify-center hover:bg-[rgba(8,157,151,0.2)] transition-colors"><Check size={13} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {read.length > 0 && (
            <div>
              <p className="font-['Poppins',sans-serif] font-semibold text-[12px] text-black/40 uppercase tracking-wider mb-3 mt-4">{t("notif_earlier")}</p>
              <div className="space-y-2">
                {read.map((n) => (
                  <div key={n.id} className="bg-white rounded-[12px] shadow-sm px-4 py-3 flex gap-3 items-start opacity-75">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${bgFor(n.type)}`}>{iconFor(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-['Poppins',sans-serif] font-medium text-[14px] text-black">{n.title}</p>
                      <p className="font-['Poppins',sans-serif] text-[12px] text-black/50 mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="font-['Poppins',sans-serif] text-[11px] text-black/30 mt-1">{new Date(n.createdAt).toLocaleString(locale)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
