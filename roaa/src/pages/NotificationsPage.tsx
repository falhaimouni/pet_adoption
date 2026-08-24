import { useState } from "react";
import { Bell, Heart, MessageSquare, AlertCircle, CheckCircle, Info, Check, CheckCheck } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import EmptyState from "../components/EmptyState";
import { useLanguage } from "../context/LanguageContext";

type NotifType = "adoption" | "chat" | "alert" | "system" | "success";
type Role = "adopter" | "staff" | "vet" | "manager" | "admin";

interface Notification {
  id: number; type: NotifType; title: string; body: string; time: string; read: boolean;
}

const NOTIFICATIONS: Notification[] = [
  { id: 1, type: "adoption", title: "Adoption Request Approved", body: "Your adoption request for Mochi has been approved! Please visit our shelter to complete the process.", time: "2 hours ago", read: false },
  { id: 2, type: "chat", title: "New Message from Staff", body: "Sara Khalil sent you a message regarding your upcoming appointment.", time: "4 hours ago", read: false },
  { id: 3, type: "alert", title: "Document Required", body: "Please upload a valid ID to complete your adopter profile.", time: "Yesterday", read: false },
  { id: 4, type: "system", title: "System Maintenance", body: "Petopia will undergo scheduled maintenance on July 20, 2026 from 2am–4am.", time: "2 days ago", read: true },
  { id: 5, type: "success", title: "Profile Updated", body: "Your profile information has been saved successfully.", time: "3 days ago", read: true },
  { id: 6, type: "adoption", title: "Pet Available Again", body: "Bella, a Golden Retriever you saved, is now available for adoption again.", time: "4 days ago", read: true },
  { id: 7, type: "chat", title: "Chat Closed", body: "Your support chat session has been marked as resolved by staff.", time: "5 days ago", read: true },
];

const typeIcon: Record<NotifType, React.ReactNode> = {
  adoption: <Heart size={16} className="text-[#089D97]" />,
  chat: <MessageSquare size={16} className="text-blue-500" />,
  alert: <AlertCircle size={16} className="text-yellow-500" />,
  system: <Info size={16} className="text-gray-400" />,
  success: <CheckCircle size={16} className="text-green-500" />,
};

const typeBg: Record<NotifType, string> = {
  adoption: "bg-[rgba(8,157,151,0.1)]",
  chat: "bg-blue-50",
  alert: "bg-yellow-50",
  system: "bg-gray-100",
  success: "bg-green-50",
};

interface NotificationsPageProps {
  onNavigate: (page: string) => void;
  role?: Role;
}

export default function NotificationsPage({ onNavigate, role = "adopter" }: NotificationsPageProps) {
  const { t } = useLanguage();
  const [items, setItems] = useState<Notification[]>(NOTIFICATIONS);
  const [filter, setFilter] = useState("all");

  const filters: { key: string; label: string }[] = [
    { key: "all",      label: t("notif_all") },
    ...(role !== "vet" ? [{ key: "adoption", label: t("notif_adoptions") }] : []),
    { key: "chat",     label: t("notif_chats") },
    { key: "alert",    label: t("notif_alerts") },
    { key: "system",   label: t("notif_system") },
  ];

  function markRead(id: number) { setItems((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n)); }
  function markAll() { setItems((prev) => prev.map((n) => ({ ...n, read: true }))); }
  function deleteItem(id: number) { setItems((prev) => prev.filter((n) => n.id !== id)); }

  const visibleItems = role === "vet" ? items.filter((n) => n.type !== "adoption") : items;
  const filtered = visibleItems.filter((n) => filter === "all" || n.type === filter);
  const unread = filtered.filter((n) => !n.read);
  const read = filtered.filter((n) => n.read);
  const unreadTotal = visibleItems.filter((n) => !n.read).length;

  return (
    <DashboardLayout role={role} activePage="notifications" onNavigate={onNavigate} pageTitle={t("notif_title")} breadcrumbs={[t("notif_title")]}>
      {/* Header actions */}
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

      {filtered.length === 0 ? (
        <EmptyState icon={<Bell size={28} />} title={t("notif_none")} description={t("notif_caught_up")} />
      ) : (
        <div className="space-y-4">
          {unread.length > 0 && (
            <div>
              <p className="font-['Poppins',sans-serif] font-semibold text-[12px] text-black/40 uppercase tracking-wider mb-3">{t("notif_unread")} ({unread.length})</p>
              <div className="space-y-2">
                {unread.map((n) => (
                  <div key={n.id} className="bg-white rounded-[12px] shadow-sm border border-[rgba(8,157,151,0.2)] px-4 py-3 flex gap-3 items-start">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${typeBg[n.type]}`}>{typeIcon[n.type]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black">{n.title}</p>
                      <p className="font-['Poppins',sans-serif] text-[12px] text-black/60 mt-0.5 leading-relaxed">{n.body}</p>
                      <p className="font-['Poppins',sans-serif] text-[11px] text-black/35 mt-1">{n.time}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => markRead(n.id)} title={t("notif_mark_all")} className="w-7 h-7 rounded-full bg-[rgba(8,157,151,0.1)] text-[#089D97] flex items-center justify-center hover:bg-[rgba(8,157,151,0.2)] transition-colors"><Check size={13} /></button>
                    </div>
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
                  <div key={n.id} className="bg-white rounded-[12px] shadow-sm px-4 py-3 flex gap-3 items-start opacity-70 hover:opacity-100 transition-opacity">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${typeBg[n.type]}`}>{typeIcon[n.type]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-['Poppins',sans-serif] font-medium text-[14px] text-black">{n.title}</p>
                      <p className="font-['Poppins',sans-serif] text-[12px] text-black/50 mt-0.5 leading-relaxed">{n.body}</p>
                      <p className="font-['Poppins',sans-serif] text-[11px] text-black/30 mt-1">{n.time}</p>
                    </div>
                    <button onClick={() => deleteItem(n.id)} className="font-['Poppins',sans-serif] text-[11px] text-black/30 hover:text-red-400 transition-colors shrink-0 mt-1">{t("notif_dismiss")}</button>
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
