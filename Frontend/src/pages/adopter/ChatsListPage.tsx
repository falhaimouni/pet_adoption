import { useEffect, useState } from "react";
import { MessageCircle, Search } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import EmptyState from "../../components/EmptyState";
import { apiFetch } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext";

export interface Conversation {
  conversationId: string;
  status: string;
  updatedAt: string;
  assignedEmployee?: { firstName: string; lastName: string } | null;
  lastMessage?: { messageText?: string | null; createdAt: string } | null;
  unreadCount?: number;
}

interface ChatsListPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

export default function ChatsListPage({ onNavigate }: ChatsListPageProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    let active = true;
    const refresh = () => apiFetch<Conversation[]>("/conversations/my")
      .then(data => { if (active) { setItems(data); setError(""); } })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : t("chat_load_error")); })
      .finally(() => { if (active) setLoading(false); });
    void refresh();
    const timer = window.setInterval(refresh, 5000);
    window.addEventListener("focus", refresh);
    window.addEventListener("petopia:notifications-changed", refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", refresh); window.removeEventListener("petopia:notifications-changed", refresh); };
  }, []);

  const filtered = items.filter((c) =>
    t("chats_support").toLowerCase().includes(search.toLowerCase()) ||
    (c.lastMessage?.messageText ?? "").toLowerCase().includes(search.toLowerCase())
  );

  async function startConversation() {
    setStarting(true);
    setError("");
    try {
      const conversation = await apiFetch<Conversation>("/conversations", {
        method: "POST",
      });
      onNavigate("chat-detail", { conversationId: conversation.conversationId });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("chat_load_error"));
    } finally {
      setStarting(false);
    }
  }

  return (
    <DashboardLayout role="adopter" activePage="chats" onNavigate={onNavigate} pageTitle={t("chats_title")} breadcrumbs={[t("adopter_dash_crumb"), t("chats_crumb")]}>
      <div className="max-w-2xl">
        <div className="bg-white rounded-[15px] shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#089D97]" />
              <input
                placeholder={t("chats_search_ph")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-[rgba(8,157,151,0.06)] border border-transparent rounded-[10px] font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-4 space-y-2">{[1, 2, 3].map((n) => <div key={n} className="h-16 rounded-[12px] bg-[#f0f8f7] animate-pulse" />)}</div>
          ) : error ? (
            <EmptyState icon={<MessageCircle size={28} />} title={t("chats_unavailable")} description={error} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={<MessageCircle size={28} />} title={t("chats_no_conv")} description={t("chats_no_conv_desc")} actionLabel={starting ? t("common_loading") : t("chat_start_conversation")} onAction={startConversation} />
          ) : (
            filtered.map((conversation) => (
              <button
                key={conversation.conversationId}
                onClick={() => onNavigate("chat-detail", { conversationId: conversation.conversationId })}
                className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 hover:bg-[rgba(8,157,151,0.04)] transition-colors text-left"
              >
                <div className="w-[46px] h-[46px] bg-[#e0f2f0] rounded-full flex items-center justify-center shrink-0">
                  <MessageCircle size={20} className="text-[#089D97]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-['Poppins',sans-serif] text-[14px] font-semibold text-black truncate">{t("chats_support")}</p>
                    <span className="font-['Poppins',sans-serif] text-[11px] text-black/40 shrink-0">{new Date(conversation.updatedAt).toLocaleDateString()}</span>
                  </div>
                  {(conversation.unreadCount ?? 0) > 0 && <p className="text-[12px] font-bold text-[#089D97]">{t("chat_new_message")}</p>}
                  <p className={`text-[12px] truncate ${(conversation.unreadCount ?? 0) > 0 ? "font-bold text-black" : "text-black/50"}`}>{conversation.lastMessage ? translateChatMessage(conversation.lastMessage.messageText ?? undefined, t) : t("chats_no_messages_yet")}</p>
                </div>
                {(conversation.unreadCount ?? 0) > 0 && <span className="shrink-0 min-w-5 h-5 px-1 bg-[#089D97] text-white text-[10px] font-bold rounded-full flex items-center justify-center">{conversation.unreadCount}</span>}
              </button>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function translateChatMessage(value: string | undefined, t: (key: string) => string) {
  if (!value) return t("chat_attachment");
  if (value === "Hello! How can we help with your adoption?") return t("chat_staff_greeting");
  return value;
}
