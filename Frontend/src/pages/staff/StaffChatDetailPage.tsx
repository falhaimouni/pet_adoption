import { useEffect, useRef, useState } from "react";
import { ArrowLeft, MessageCircle, Send } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import EmptyState from "../../components/EmptyState";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

interface Message {
  messageId: string;
  senderId: string;
  message: string;
  createdAt: string;
}

interface ConversationDetail {
  conversationId: string;
  status: string;
  messages: Message[];
}

interface StaffChatDetailPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
  conversationId?: string;
}

export default function StaffChatDetailPage({ onNavigate, conversationId }: StaffChatDetailPageProps) {
  const { user } = useAuth();
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId) {
      setError("Conversation id is missing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    apiFetch<ConversationDetail>(`/messages/conversations/${conversationId}`)
      .then((detail) => {
        setConversation(detail);
        void apiFetch(`/messages/conversations/${conversationId}/read`, { method: "PATCH" }).catch(() => undefined);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load conversation."))
      .finally(() => setLoading(false));
  }, [conversationId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages.length]);

  async function send() {
    if (!conversationId || !input.trim() || input.length > 5000) return;
    setSending(true);
    setError("");
    try {
      const sent = await apiFetch<Message>("/messages/send", {
        method: "POST",
        body: JSON.stringify({ conversationId, message: input.trim() }),
      });
      setConversation((prev) => prev ? { ...prev, messages: [...prev.messages, sent] } : prev);
      setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send message.");
    } finally {
      setSending(false);
    }
  }

  async function setStatus(status: "closed" | "open") {
    if (!conversationId) return;
    try {
      const updated = await apiFetch<ConversationDetail>(`/messages/conversations/${conversationId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setConversation((prev) => prev ? { ...prev, status: updated.status } : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update conversation.");
    }
  }

  const closed = conversation?.status === "closed" || conversation?.status === "archived";

  return (
    <DashboardLayout role="staff" activePage="staff-chats" onNavigate={onNavigate}>
      <div className="max-w-3xl flex flex-col bg-white rounded-[15px] shadow-md overflow-hidden" style={{ height: "calc(100vh - 160px)" }}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <button onClick={() => onNavigate("staff-chats")} className="text-[#089D97] hover:text-[#047975] transition-colors" aria-label="Back to inbox"><ArrowLeft size={20} /></button>
          <MessageCircle size={20} className="text-[#089D97]" />
          <div className="flex-1">
            <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black">Conversation</p>
            {conversation && <p className="font-['Poppins',sans-serif] text-[11px] text-[#089D97] capitalize">{conversation.status.replace("_", " ")}</p>}
          </div>
          {conversation && (
            <button onClick={() => setStatus(closed ? "open" : "closed")} className="px-3 py-1.5 rounded-[10px] border border-[#089D97] text-[#089D97] font-['Poppins',sans-serif] text-[12px] hover:bg-[rgba(8,157,151,0.08)]">
              {closed ? "Reopen" : "Close"}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex-1 p-4 space-y-3 bg-[rgba(186,216,211,0.1)]">{[1, 2, 3].map((n) => <div key={n} className="h-12 rounded-[16px] bg-white animate-pulse" />)}</div>
        ) : error && !conversation ? (
          <EmptyState icon={<MessageCircle size={28} />} title="Conversation unavailable" description={error} actionLabel="Back to Inbox" onAction={() => onNavigate("staff-chats")} />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[rgba(186,216,211,0.1)]">
              {conversation?.messages.map((m) => {
                const fromMe = m.senderId === user?.id;
                return (
                  <div key={m.messageId} className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-[16px] px-4 py-2.5 ${fromMe ? "bg-[#089D97] text-white rounded-tr-[4px]" : "bg-white text-black shadow-sm rounded-tl-[4px]"}`}>
                      <p className="font-['Poppins',sans-serif] text-[13px] leading-relaxed whitespace-pre-wrap break-words">{m.message}</p>
                      <span className={`block text-right font-['Poppins',sans-serif] text-[10px] mt-1 ${fromMe ? "text-white/70" : "text-black/40"}`}>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>
            {error && <p className="px-4 py-2 font-['Poppins',sans-serif] text-[12px] text-red-600 bg-red-50">{error}</p>}
            <div className="px-4 py-3 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} maxLength={5000} disabled={closed} placeholder={closed ? "Conversation is closed" : "Type a message..."} className="flex-1 bg-[rgba(8,157,151,0.06)] rounded-[20px] px-4 py-2.5 font-['Poppins',sans-serif] text-[13px] outline-none focus:ring-1 focus:ring-[#089D97] transition-all disabled:opacity-60" />
                <button onClick={send} disabled={sending || closed || !input.trim()} className="w-[38px] h-[38px] bg-[#089D97] disabled:opacity-40 rounded-full flex items-center justify-center text-white hover:bg-[#047975] transition-colors shrink-0" aria-label="Send message"><Send size={16} /></button>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
