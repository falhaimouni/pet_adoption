import AuthenticatedImage from "../components/AuthenticatedImage";
import fallback from "../assets/default-avatar.svg";
import { FormEvent, useCallback, useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";
import {
  buttonClass,
  Person,
  PersonIdentity,
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
  const current = conversations.find((c) => c.id === conversationId);
  const refresh = useCallback(async () => {
    try {
      const [chats, people] = await Promise.all([
        apiFetch<Conversation[]>("/direct-conversations"),
        apiFetch<{ friend: Person; online: boolean }[]>("/friends"),
      ]);
      setConversations(chats);
      setFriends(people);
      if (conversationId) {
        const rows = await apiFetch<Message[]>(
          `/direct-conversations/${conversationId}/messages`,
        );
        setMessages((prev) => {
          const map = new Map(prev.map((m) => [m.id, m]));
          rows.forEach((m) => map.set(m.id, m));
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
      setError((e as Error).message);
    } finally {
      setLoading(false);
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
  async function send(e: FormEvent) {
    e.preventDefault();
    if (!conversationId) return;
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/direct-conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      setText("");
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <DashboardLayout
      role="adopter"
      activePage="chats"
      onNavigate={onNavigate}
      pageTitle="Chat"
    >
      <div className="w-full space-y-4 pb-20">
        <h1 className="text-2xl font-semibold">Private Chat</h1>
        <p>Private conversations with your friends.</p>
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        {loading && <p>Loading conversations…</p>}
        <div className="w-full">
          {!conversationId && (
            <aside className="w-full space-y-3 rounded-xl bg-white p-4">
              <input
                type="search"
                aria-label="Search friends"
                placeholder="Search friends…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-teal-500"
              />
              {!loading && !friends.length && (
                <p>You don't have any friends yet.</p>
              )}
              {friends
                .filter((f) =>
                  f.friend.name
                    .toLowerCase()
                    .includes(search.trim().toLowerCase()),
                )
                .map((f) => {
                  const chat = conversations.find(
                    (c) => c.friend.id === f.friend.id,
                  );
                  return (
                    <button
                      key={f.friend.id}
                      disabled={busy}
                      className={`flex w-full items-center gap-3 rounded-lg p-3 text-left ${chat?.id === conversationId && conversationId ? "bg-teal-50" : "hover:bg-gray-50"}`}
                      onClick={async () => {
                        if (chat) {
                          onNavigate("chats", { id: chat.id });
                          return;
                        }
                        setBusy(true);
                        setError("");
                        try {
                          const created = await apiFetch<{ id: string }>(
                            "/direct-conversations",
                            {
                              method: "POST",
                              body: JSON.stringify({ userId: f.friend.id }),
                            },
                          );
                          onNavigate("chats", { id: created.id });
                        } catch (e) {
                          setError((e as Error).message);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      <AuthenticatedImage
                        src={f.friend.avatar}
                        fallback={fallback}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">
                          {f.friend.name}
                        </span>
                        <span
                          className={`block text-xs ${f.online ? "text-green-700" : "text-gray-500"}`}
                        >
                          {f.online ? "Online" : "Offline"}
                        </span>
                        <span className="block truncate text-xs text-gray-500">
                          {chat?.lastMessage || "Start chatting"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              {search.trim() &&
                friends.length > 0 &&
                !friends.some((f) =>
                  f.friend.name
                    .toLowerCase()
                    .includes(search.trim().toLowerCase()),
                ) && <p>No friends found.</p>}
              {conversations.some(
                (c) => !friends.some((f) => f.friend.id === c.friend.id),
              ) && (
                <div className="border-t pt-3">
                  <p className="mb-2 text-xs text-gray-500">
                    Previous conversations
                  </p>
                  {conversations
                    .filter(
                      (c) =>
                        !friends.some((f) => f.friend.id === c.friend.id) &&
                        c.friend.name
                          .toLowerCase()
                          .includes(search.trim().toLowerCase()),
                    )
                    .map((c) => (
                      <button
                        key={c.id}
                        className="block w-full rounded-lg p-2 text-left text-sm hover:bg-gray-50"
                        onClick={() => onNavigate("chats", { id: c.id })}
                      >
                        {c.friend.name}
                      </button>
                    ))}
                </div>
              )}
            </aside>
          )}
          {conversationId && (
            <section className="w-full space-y-4 rounded-xl bg-white p-4">
              <button
                type="button"
                className={buttonClass}
                onClick={() => onNavigate("chats")}
              >
                ← Back to chats
              </button>
              {!conversationId ? (
                <p>Select a conversation.</p>
              ) : (
                <>
                  {current && (
                    <PersonIdentity
                      person={current.friend}
                      onClick={() => setProfile(current.friend.id)}
                    />
                  )}
                  {older && messages.length > 0 && (
                    <button
                      className={buttonClass}
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        try {
                          const rows = await apiFetch<Message[]>(
                            `/direct-conversations/${conversationId}/messages?before=${messages[0].id}`,
                          );
                          setMessages((prev) => [
                            ...new Map(
                              [...rows.reverse(), ...prev].map((m) => [
                                m.id,
                                m,
                              ]),
                            ).values(),
                          ]);
                          setOlder(rows.length === 50);
                        } catch (e) {
                          setError((e as Error).message);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Load older messages
                    </button>
                  )}
                  <div aria-label="Private messages" className="space-y-3">
                    {messages.map((m) => (
                      <article
                        key={m.id}
                        className={`max-w-[85%] rounded-xl p-3 ${m.senderId === user?.id ? "ms-auto bg-teal-50" : "bg-gray-100"}`}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {m.text}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {new Date(m.createdAt).toLocaleString()}
                          {m.senderId === user?.id &&
                            (m.readAt ? " · Read" : " · Sent")}
                        </p>
                      </article>
                    ))}
                  </div>
                  {current?.canSend ? (
                    <form onSubmit={send} className="flex gap-2">
                      <textarea
                        aria-label="Private message"
                        value={text}
                        maxLength={4000}
                        onChange={(e) => setText(e.target.value)}
                        className="min-w-0 flex-1 rounded-lg border p-3"
                        placeholder="Write a private message…"
                      />
                      <button
                        className={buttonClass}
                        disabled={busy || !text.trim()}
                      >
                        Send
                      </button>
                    </form>
                  ) : (
                    !loading && (
                      <p className="text-gray-500">
                        You must be friends to send messages. Previous messages
                        remain available.
                      </p>
                    )
                  )}
                </>
              )}
            </section>
          )}
        </div>
        {profile && (
          <PublicProfile
            key={profile}
            id={profile}
            onClose={() => setProfile(undefined)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
