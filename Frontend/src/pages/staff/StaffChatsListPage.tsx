import { useEffect, useState } from "react";
import { MessageCircle, Search } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import EmptyState from "../../components/EmptyState";
import { apiFetch } from "../../lib/api";
import type { Role } from "../../components/DashboardLayout";
import { useLanguage } from "../../context/LanguageContext";

interface Conversation {
  conversationId: string;
  status: string;
  updatedAt: string;
  adopter: { user: { firstName: string; lastName: string } };
  lastMessage?: { messageText?: string | null; createdAt: string } | null;
  unreadCount?: number;
}

interface StaffChatsListPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
  role?: Role;
  activePage?: string;
  detailPage?: string;
  readOnly?: boolean;
}

export default function StaffChatsListPage({ onNavigate, role = "employee", activePage = "staff-chats", detailPage = "staff-chat-detail", readOnly = false }: StaffChatsListPageProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    apiFetch<Conversation[]>("/conversations/inbox")
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : t("chat_load_conversations_error")))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((c) => {
    const adopter = `${c.adopter.user.firstName} ${c.adopter.user.lastName}`.toLowerCase();
    return adopter.includes(search.toLowerCase()) || c.status.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <DashboardLayout role={role} activePage={activePage} onNavigate={onNavigate} pageTitle={readOnly ? t("chat_readonly_title") : t("chat_staff_inbox")} breadcrumbs={[t(`role_${role}`), t("nav_chats")]}>
      <div className="max-w-2xl bg-white rounded-[15px] shadow-md overflow-hidden">
        {readOnly && (
          <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
            <p className="font-['Poppins',sans-serif] text-[12px] text-amber-800">{t("chat_readonly_list")}</p>
          </div>
        )}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#089D97]" />
            <input placeholder={t("chats_search_ph")} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-[rgba(8,157,151,0.06)] rounded-[10px] font-['Poppins',sans-serif] text-[13px] outline-none focus:ring-1 focus:ring-[#089D97] transition-all" />
          </div>
        </div>
        {loading ? (
          <div className="p-4 space-y-2">{[1, 2, 3].map((n) => <div key={n} className="h-16 rounded-[12px] bg-[#f0f8f7] animate-pulse" />)}</div>
        ) : error ? (
          <EmptyState icon={<MessageCircle size={28} />} title={t("chat_inbox_unavailable")} description={error} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<MessageCircle size={28} />} title={t("chats_no_conv")} description={t("chat_no_conversations_match")} />
        ) : (
          filtered.map((c) => (
            <button key={c.conversationId} onClick={() => onNavigate(detailPage, { conversationId: c.conversationId })} className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 hover:bg-[rgba(8,157,151,0.04)] transition-colors text-left">
              <div className="w-[44px] h-[44px] bg-[#e0f2f0] rounded-full flex items-center justify-center shrink-0"><MessageCircle size={18} className="text-[#089D97]" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-['Poppins',sans-serif] text-[13px] font-semibold text-black truncate">{c.adopter.user.firstName} {c.adopter.user.lastName}</p>
                  <span className="font-['Poppins',sans-serif] text-[11px] text-black/40">{new Date(c.updatedAt).toLocaleDateString()}</span>
                </div>
                <p className="font-['Poppins',sans-serif] text-[11px] text-[#089D97] capitalize">{t(`status_${c.status.toLowerCase().replace(/\s+/g, "_")}`)}</p>
                <p className="font-['Poppins',sans-serif] text-[12px] text-black/50 truncate">{c.lastMessage?.messageText ?? t("chats_no_messages_yet")}</p>
              </div>
              {(c.unreadCount ?? 0) > 0 && <span className="shrink-0 min-w-5 h-5 px-1 bg-[#089D97] text-white text-[10px] font-bold rounded-full flex items-center justify-center">{c.unreadCount}</span>}
            </button>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
