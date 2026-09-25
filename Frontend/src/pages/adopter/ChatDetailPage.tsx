import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, MessageCircle, Send } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import EmptyState from "../../components/EmptyState";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useConversationSocket } from "../../hooks/useConversationSocket";

interface Message {
  messageId: string;
  senderId: string;
  messageText?: string | null;
  isRead?: boolean;
  createdAt: string;
}

interface ConversationDetail {
  conversationId: string;
  status: string;
  messages: Message[];
}

interface ChatDetailPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
  conversationId?: string;
}

export default function ChatDetailPage({ onNavigate, conversationId }: ChatDetailPageProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const receiveMessage = useCallback((message: Message) => {
    setConversation((current) => {
      if (!current || current.messages.some((item) => item.messageId === message.messageId)) return current;
      return { ...current, messages: [...current.messages, message] };
    });
    if (conversationId && message.senderId !== user?.id) {
      void apiFetch(`/conversations/${conversationId}/messages/read`, { method: "PATCH" }).catch(() => undefined);
    }
  }, [conversationId, user?.id]);

  const realtimeStatus = useConversationSocket(conversationId, receiveMessage);

  useEffect(() => {
    if (!conversationId) {
      setError(t("chat_missing_conversation"));
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    apiFetch<ConversationDetail>(`/conversations/${conversationId}`)
      .then((detail) => {
        setConversation(detail);
        void apiFetch(`/conversations/${conversationId}/messages/read`, { method: "PATCH" }).catch(() => undefined);
      })
      .catch((err) => setError(err instanceof Error ? err.message : t("chat_load_error")))
      .finally(() => setLoading(false));
  }, [conversationId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages.length]);

  async function send() {
    if (sending || !conversationId || !input.trim() || input.length > 5000) return;
    setSending(true);
    setError("");
    try {
      const sent = await apiFetch<Message>(`/conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ messageText: input.trim(), type: "TEXT" }),
      });
      receiveMessage(sent);
      setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("chat_send_error"));
    } finally {
      setSending(false);
    }
  }



  return (
    <DashboardLayout role="adopter" activePage="support-chat" onNavigate={onNavigate}>
      <div className="w-full flex flex-col h-[min(720px,calc(100dvh-128px))] min-h-[420px] bg-white rounded-[15px] shadow-md overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
          <button onClick={() => onNavigate("support-chat")} className="text-[#089D97] hover:text-[#047975] transition-colors" aria-label={t("chat_back_conversations")}>
            <ArrowLeft size={20} />
          </button>
          <MessageCircle size={20} className="text-[#089D97]" />
          <div className="min-w-0 flex-1">
            <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black">{t("chats_support")}</p>
            {realtimeStatus !== "disabled" && (
              <p className={`flex items-center gap-1.5 font-['Poppins',sans-serif] text-[10px] ${realtimeStatus === "connected" ? "text-emerald-600" : "text-black/45"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${realtimeStatus === "connected" ? "bg-emerald-500" : "bg-black/30"}`} />
                {t(realtimeStatus === "connected" ? "chat_realtime_connected" : "chat_realtime_connecting")}
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex-1 p-4 space-y-3 bg-[rgba(186,216,211,0.15)]">{[1, 2, 3].map((n) => <div key={n} className="h-12 rounded-[16px] bg-white animate-pulse" />)}</div>
        ) : error && !conversation ? (
          <EmptyState icon={<MessageCircle size={28} />} title={t("chat_unavailable")} description={error} actionLabel={t("chat_back_messages")} onAction={() => onNavigate("support-chat")} />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[rgba(186,216,211,0.15)]">
              {conversation?.messages.length === 0 && <EmptyState icon={<MessageCircle size={28} />} title={t("chats_no_messages_yet")} description={t("chat_first_message")} />}
              {conversation?.messages.map((m) => {
                const fromMe = m.senderId === user?.id;
                return (
                  <div key={m.messageId} className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[88%] sm:max-w-[75%] rounded-[16px] px-4 py-2.5 ${fromMe ? "bg-[#089D97] text-white rounded-se-[4px]" : "bg-white text-black shadow-sm rounded-ss-[4px]"}`}>
                      <p className="font-['Poppins',sans-serif] text-[13px] leading-relaxed whitespace-pre-wrap break-words">{m.messageText}</p>
                      <span className={`block text-end font-['Poppins',sans-serif] text-[10px] mt-1 ${fromMe ? "text-white/70" : "text-black/40"}`}>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>
            {error && <p className="px-4 py-2 font-['Poppins',sans-serif] text-[12px] text-red-600 bg-red-50">{error}</p>}
            <div className="px-4 py-3 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  maxLength={5000}
                  placeholder={t("chat_type_message")}
                  className="flex-1 bg-[rgba(8,157,151,0.06)] rounded-[20px] px-4 py-2.5 font-['Poppins',sans-serif] text-[13px] outline-none focus:ring-1 focus:ring-[#089D97] transition-all disabled:opacity-60"
                />
                <button onClick={send} disabled={sending || !input.trim()} className="w-[38px] h-[38px] bg-[#089D97] disabled:opacity-40 rounded-full flex items-center justify-center text-white hover:bg-[#047975] transition-colors shrink-0" aria-label={t("chat_send_message")}>
                  <Send size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
