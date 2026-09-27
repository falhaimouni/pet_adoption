import { useText } from "../i18n/useText";
import { SOCKET_EVENTS } from "@shared/events/socket.events";
import AuthenticatedImage from "../components/AuthenticatedImage";
import fallback from "../assets/default-avatar.svg";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, MessageCircle, Search, Send } from "lucide-react";
import EmptyState from "../components/EmptyState";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";
import {
  Person,
  PublicProfile,
} from "./CommunityPage";
type Conversation = {
  id: string;
  friend: Person;
  canSend: boolean;
  lastMessage?: string;
};
type Message = {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
  readAt?: string;
};
export default function DirectChatPage({
  onNavigate,
  conversationId,
}: {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
  conversationId?: string;
}) {
  const tx = useText();
  const { user } = useAuth();
  const [friends, setFriends] = useState<{ friend: Person; online: boolean }[]>(
    [],
  );
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [older, setOlder] = useState(false);
  const [profile, setProfile] = useState<string>();
  const activeConversation = useRef(conversationId);
  activeConversation.current = conversationId;
  const messagesRef = useRef<HTMLDivElement>(null);
  const latestMessageId = messages[messages.length - 1]?.id;
  useEffect(() => {
    const container = messagesRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [latestMessageId, loading]);
  const current = conversations.find((c) => c.id === conversationId);
  const refresh = useCallback(async () => {
    try {
      const [chats, people] = await Promise.all([
        apiFetch<Conversation[]>("/direct-conversations"),
        apiFetch<{ friend: Person; online: boolean }[]>("/friends"),
      ]);
      if (activeConversation.current !== conversationId) return;
      setConversations(chats);
      setFriends(people);
      if (conversationId) {
        const rows = await apiFetch<Message[]>(
          `/direct-conversations/${conversationId}/messages`,
        );
        if (activeConversation.current !== conversationId) return;
        setMessages((prev) => {
          const map = new Map(prev.map((m) => [m.id, m]));
          rows.forEach((m) => map.set(m.id, { ...m, readAt: m.readAt ?? map.get(m.id)?.readAt }));
          return [...map.values()].sort(
            (a, b) =>
              a.createdAt.localeCompare(b.createdAt) ||
              a.id.localeCompare(b.id),
          );
        });
        setOlder(rows.length === 50);
        await apiFetch(`/direct-conversations/${conversationId}/read`, {
          method: "PATCH",
        });
      }
    } catch (e) {
      if (activeConversation.current === conversationId) setError((e as Error).message);
    } finally {
      if (activeConversation.current === conversationId) setLoading(false);
    }
  }, [conversationId]);
  useEffect(() => {
    setMessages([]);
    setLoading(true);
    setError("");
    void refresh();
    const timer = setInterval(refresh, 4000);
    return () => clearInterval(timer);
  }, [refresh]);
  useEffect(() => {
    function receive(event: Event) {
      const detail = (event as CustomEvent<{ conversationId: string; message: Message }>).detail;
      setConversations((chats) => chats.map((chat) => chat.id === detail.conversationId ? { ...chat, lastMessage: detail.message.text } : chat));
      if (detail.conversationId !== conversationId) {
        void refresh();
        return;
      }
      setMessages((rows) => [...new Map([...rows, { ...detail.message, readAt: detail.message.readAt ?? rows.find((m) => m.id === detail.message.id)?.readAt }].map((m) => [m.id, m])).values()]
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)));
      if (detail.message.senderId !== user?.id) {
        void apiFetch(`/direct-conversations/${conversationId}/read`, { method: "PATCH" }).catch(() => undefined);
      }
    }
    function read(event: Event) {
      const detail = (event as CustomEvent<{ conversationId: string; messages: { id: string; readAt: string }[] }>).detail;
      if (detail.conversationId !== conversationId) return;
      const receipts = new Map(detail.messages.map((m) => [m.id, m.readAt]));
      setMessages((rows) => rows.map((m) => receipts.has(m.id) ? { ...m, readAt: receipts.get(m.id) } : m));
    }
    function presence(event: Event) {
      const { userId, online } = (event as CustomEvent<{ userId: string; online: boolean }>).detail;
      setFriends((rows) => rows.map((row) => row.friend.id === userId ? { ...row, online } : row));
    }
    window.addEventListener(`petopia:${SOCKET_EVENTS.DIRECT_MESSAGE}`, receive);
    window.addEventListener(`petopia:${SOCKET_EVENTS.DIRECT_MESSAGES_READ}`, read);
    window.addEventListener(`petopia:${SOCKET_EVENTS.FRIEND_PRESENCE}`, presence);
    window.addEventListener("petopia:realtime-connected", refresh);
    return () => {
      window.removeEventListener(`petopia:${SOCKET_EVENTS.DIRECT_MESSAGE}`, receive);
      window.removeEventListener(`petopia:${SOCKET_EVENTS.DIRECT_MESSAGES_READ}`, read);
      window.removeEventListener(`petopia:${SOCKET_EVENTS.FRIEND_PRESENCE}`, presence);
      window.removeEventListener("petopia:realtime-connected", refresh);
    };
  }, [conversationId, refresh, user?.id]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!conversationId || busy || !text.trim() || !current?.canSend) return;
    setBusy(true);
    setError("");
    try {
      const sent = await apiFetch<Message>(`/direct-conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      if (activeConversation.current !== conversationId) return;
      setMessages((rows) => [...new Map([...rows, { ...sent, readAt: sent.readAt ?? rows.find((m) => m.id === sent.id)?.readAt }].map((m) => [m.id, m])).values()]);
      setConversations((chats) => chats.map((chat) => chat.id === conversationId ? { ...chat, lastMessage: sent.text } : chat));
      setText("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const query = search.trim().toLowerCase();
  const filteredFriends = friends.filter(({ friend }) => friend.name.toLowerCase().includes(query));
  const previousConversations = conversations.filter(
    (chat) => !friends.some(({ friend }) => friend.id === chat.friend.id) && chat.friend.name.toLowerCase().includes(query),
  );
  const online = friends.some(({ friend, online }) => friend.id === current?.friend.id && online);

  async function openChat(friend: Person) {
    const chat = conversations.find((item) => item.friend.id === friend.id);
    if (chat) {
      onNavigate("chats", { id: chat.id });
      return;
    }
    setBusy(true);
    setError("");
    try {
      const created = await apiFetch<{ id: string }>("/direct-conversations", {
        method: "POST",
        body: JSON.stringify({ userId: friend.id }),
      });
      onNavigate("chats", { id: created.id });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function loadOlder() {
    setBusy(true);
    try {
      const rows = await apiFetch<Message[]>(
        `/direct-conversations/${conversationId}/messages?before=${messages[0].id}`,
      );
      setMessages((prev) => [...new Map([...rows.reverse(), ...prev].map((m) => [m.id, m])).values()]);
      setOlder(rows.length === 50);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function conversationRow(friend: Person, chat?: Conversation, isOnline = false) {
    return (
      <div
        key={friend.id}
        className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 hover:bg-[rgba(8,157,151,0.04)] transition-colors text-start disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#089D97]"
      >
        <button type="button" onClick={() => setProfile(friend.id)}
          aria-label={tx("Profile of {name}", { name: friend.name })}
          className="shrink-0 rounded-full focus-visible:ring-2 focus-visible:ring-teal-500">
        <AuthenticatedImage src={friend.avatar} fallback={fallback} alt="" className="w-[44px] h-[44px] rounded-full object-cover shrink-0 bg-[#e0f2f0]" />
        </button>
        <button type="button" disabled={busy}
          onClick={() => chat ? onNavigate("chats", { id: chat.id }) : void openChat(friend)}
          className="flex-1 min-w-0 text-start disabled:opacity-60">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-semibold text-black truncate">{friend.name}</p>
            <span className={`flex items-center gap-1.5 text-[10px] shrink-0 ${isOnline ? "text-emerald-600" : "text-black/40"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-black/30"}`} />
              {isOnline ? tx("Online") : tx("Offline")}
            </span>
          </div>
          <p className="text-[12px] truncate text-black/50">{chat?.lastMessage || tx("Start chatting")}</p>
        </button>
      </div>
    );
  }

  return (
    <DashboardLayout role="adopter" activePage="chats" onNavigate={onNavigate} pageTitle={tx("Private Chat")}>
      <div className={`w-full bg-white rounded-[15px] shadow-md overflow-hidden font-['Poppins',sans-serif] ${conversationId ? "flex flex-col h-[min(720px,calc(100dvh-128px))] min-h-[420px]" : ""}`}>
        {!conversationId ? (
          <>
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-[#089D97]" />
                <input type="search" aria-label={tx("Search friends")} placeholder={tx("Search friends…")} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full ps-8 pe-3 py-2 bg-[rgba(8,157,151,0.06)] rounded-[10px] text-[13px] outline-none focus:ring-1 focus:ring-[#089D97] transition-all" />
              </div>
            </div>
            {error && <p role="alert" className="px-4 py-2 text-[12px] text-red-600 bg-red-50">{error}</p>}
            {loading ? (
              <div role="status" aria-label={tx("Loading conversations")} className="p-4 space-y-2">{[1, 2, 3].map((n) => <div key={n} className="h-16 rounded-[12px] bg-[#f0f8f7] animate-pulse" />)}</div>
            ) : (
              <>
                {filteredFriends.map(({ friend, online }) => conversationRow(friend, conversations.find((chat) => chat.friend.id === friend.id), online))}
                {previousConversations.length > 0 && (
                  <>
                    <p className="px-4 py-2 text-[11px] text-black/45 bg-[rgba(8,157,151,0.04)]">{tx("Previous conversations")}</p>
                    {previousConversations.map((chat) => conversationRow(chat.friend, chat))}
                  </>
                )}
                {!filteredFriends.length && !previousConversations.length && (
                  <EmptyState icon={<MessageCircle size={28} />} title={query ? tx("No conversations found") : tx("No conversations yet")} description={query ? tx("Try searching for another friend's name.") : tx("Add friends in the community to start a private conversation.")} />
                )}
              </>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
              <button type="button" onClick={() => onNavigate("chats")} className="text-[#089D97] hover:text-[#047975] transition-colors" aria-label={tx("Back to chats")}><ArrowLeft size={20} /></button>
              {current ? (
                <button onClick={() => setProfile(current.friend.id)} className="flex items-center gap-3 min-w-0 text-start rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#089D97]" aria-label={tx("Profile of {name}", { name: current.friend.name })}>
                  <AuthenticatedImage src={current.friend.avatar} fallback={fallback} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-[14px] text-black">{current.friend.name}</span>
                    <span className={`flex items-center gap-1.5 text-[10px] ${online ? "text-emerald-600" : "text-black/45"}`}><span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-500" : "bg-black/30"}`} />{online ? tx("Online") : tx("Offline")}</span>
                  </span>
                </button>
              ) : <p className="font-semibold text-[14px]">{tx("Private Chat")}</p>}
            </div>
            <div ref={messagesRef} aria-label={tx("Private messages")} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3 bg-[rgba(186,216,211,0.15)]">
              {loading ? (
                <div role="status" aria-label={tx("Loading messages")} className="space-y-3">{[1, 2, 3].map((n) => <div key={n} className="h-12 rounded-[16px] bg-white animate-pulse" />)}</div>
              ) : (
                <>
                  {older && messages.length > 0 && <div className="text-center"><button disabled={busy} onClick={loadOlder} className="rounded-full bg-white px-4 py-2 text-[12px] text-[#089D97] shadow-sm hover:bg-teal-50 disabled:opacity-40">{tx("Load older messages")}</button></div>}
                  {!messages.length && !error && <EmptyState icon={<MessageCircle size={28} />} title={tx("No messages yet")} description={tx("Start your private conversation with a friendly hello.")} />}
                  {messages.map((m) => {
                    const fromMe = m.senderId === user?.id;
                    return (
                      <article key={m.id} className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[88%] sm:max-w-[75%] rounded-[16px] px-4 py-2.5 ${fromMe ? "bg-[#089D97] text-white rounded-se-[4px]" : "bg-white text-black shadow-sm rounded-ss-[4px]"}`}>
                          <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{m.text}</p>
                          <p className={`block text-end text-[10px] mt-1 ${fromMe ? "text-white/70" : "text-black/40"}`}>
                            <time dateTime={m.createdAt} title={new Date(m.createdAt).toLocaleString(document.documentElement.lang)}>{new Date(m.createdAt).toLocaleTimeString(document.documentElement.lang, { hour: "2-digit", minute: "2-digit" })}</time>
                            {fromMe && (m.readAt ? " · Read" : " · Sent")}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </>
              )}
            </div>
            {error && <p role="alert" className="px-4 py-2 text-[12px] text-red-600 bg-red-50">{error}</p>}
            <div className="px-4 py-3 border-t border-gray-100 bg-white">
              {current?.canSend ? (
                <form onSubmit={send} className="flex items-center gap-2">
                  <textarea aria-label={tx("Private message")} value={text} maxLength={4000} rows={1} onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      if (!e.repeat) e.currentTarget.form?.requestSubmit();
                    }
                  }} onChange={(e) => setText(e.target.value)} className="min-w-0 flex-1 resize-none bg-[rgba(8,157,151,0.06)] rounded-[20px] px-4 py-2.5 text-[13px] outline-none focus:ring-1 focus:ring-[#089D97] transition-all" placeholder={tx("Write a private message…")} />
                  <button type="submit" aria-label={tx("Send message")} disabled={busy || !text.trim()} className="w-[38px] h-[38px] bg-[#089D97] disabled:opacity-40 rounded-full flex items-center justify-center text-white hover:bg-[#047975] transition-colors shrink-0"><Send size={16} /></button>
                </form>
              ) : !loading && <p className="text-[12px] text-black/50">{tx("You must be friends to send messages. Previous messages remain available.")}</p>}
            </div>
          </>
        )}
      </div>
      {profile && <PublicProfile key={profile} id={profile} onFriendshipChange={() => { void refresh(); }} onClose={() => setProfile(undefined)} />}
    </DashboardLayout>
  );
}
