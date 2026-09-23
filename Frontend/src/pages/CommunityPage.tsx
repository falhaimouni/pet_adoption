import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../app/components/ui/dialog";
import { ChevronDown, X, Plus, ArrowUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../app/components/ui/dropdown-menu";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import AuthenticatedImage from "../components/AuthenticatedImage";
import { useAuth } from "../context/AuthContext";
import { ApiError, apiFetch } from "../lib/api";
import fallback from "../assets/default-avatar.svg";

export interface Person {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  role: string;
}
type Message = {
  id: string;
  text: string | null;
  sender: Person;
  createdAt: string;
  deletedAt?: string;
  image?: string;
  reply?: { id: string; text: string };
};
export const buttonClass =
  "rounded-lg border border-teal-200 px-3 py-2 text-sm text-teal-800 hover:bg-teal-50 disabled:opacity-50";
export function PersonIdentity({
  person,
  onClick,
}: {
  person: Person;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!onClick}
      onClick={onClick}
      className="flex items-center gap-2 text-left disabled:cursor-default"
    >
      <AuthenticatedImage
        src={person.avatar}
        fallback={fallback}
        className="h-10 w-10 rounded-full object-cover"
        alt={`${person.name}'s profile`}
      />
      <span className="font-semibold">{person.name}</span>
      {person.role === "VET" && (
        <span className="rounded-full bg-teal-100 px-2 py-1 text-xs text-teal-800">
          Vet
        </span>
      )}
    </button>
  );
}
export function PublicProfile({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const [person, setPerson] = useState<Person>();
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    apiFetch<Person>(`/public-profiles/${id}`)
      .then((p) => {
        if (active) setPerson(p);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="User profile"
        className="relative w-full max-w-md space-y-4 rounded-2xl bg-white p-6 pt-12"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          autoFocus
          aria-label="Close profile"
          className="absolute right-3 top-3 rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          onClick={onClose}
        >
          <X size={20} aria-hidden="true" />
        </button>
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        {person ? (
          <>
            <PersonIdentity person={person} />
            <p className="break-all text-sm text-gray-600">{person.email}</p>
            <div className="flex justify-center pt-4">
              <button
                disabled={busy || sent}
                className={buttonClass}
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  try {
                    await apiFetch("/friend-requests", {
                      method: "POST",
                      body: JSON.stringify({ userId: id }),
                    });
                    setSent(true);
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {sent ? "Friend request sent" : "Send friend request"}
              </button>
            </div>
          </>
        ) : (
          !error && <p>Loading profile…</p>
        )}
      </section>
    </div>
  );
}
export default function CommunityPage({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<File>();
  const [reply, setReply] = useState<Message>();
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState<string>();
  const [blocks, setBlocks] = useState<{ user: Person }[]>([]);
  const [showBlocks, setShowBlocks] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const pages = useRef(1);
  const refreshing = useRef(false);
  const staff = ["admin", "manager", "employee"].includes(user?.role ?? "");
  const refresh = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    try {
      const access = await apiFetch<{ blocked: boolean }>("/community/access");
      setBlocked(access.blocked);
      if (access.blocked) {
        setMessages([]);
        setReply(undefined);
        return;
      }
      let rows: Message[] = [];
      let batch: Message[] = [];
      for (let page = 0; page < pages.current; page++) {
        const before = rows.length ? `?before=${rows[rows.length - 1].id}` : "";
        batch = await apiFetch<Message[]>(`/community/messages${before}`);
        rows = [...rows, ...batch];
        if (batch.length < 50) break;
      }
      setMessages(rows.reverse());
      setHasOlder(batch.length === 50);
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        setBlocked(true);
        setMessages([]);
      } else setError((e as Error).message);
    } finally {
      setLoading(false);
      refreshing.current = false;
    }
  }, []);
  useEffect(() => {
    void refresh();
    const timer = window.setInterval(refresh, 4000);
    return () => clearInterval(timer);
  }, [refresh]);
  async function action(work: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await work();
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function send(e: FormEvent) {
    e.preventDefault();
    await action(async () => {
      const data = new FormData();
      if (text.trim()) data.append("text", text.trim());
      if (photo) data.append("photo", photo);
      if (reply) data.append("replyTo", reply.id);
      await apiFetch("/community/messages", { method: "POST", body: data });
      setText("");
      setPhoto(undefined);
      setReply(undefined);
      if (input.current) input.current.value = "";
    });
  }
  return (
    <DashboardLayout
      role={user?.role ?? "adopter"}
      activePage="community"
      onNavigate={onNavigate}
      pageTitle="Community"
    >
      <div className="w-full space-y-4 pb-20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-600">
              Ask about pets, share photos, and talk with the community.
            </p>
          </div>
          {staff && (
            <button
              className={buttonClass}
              onClick={() =>
                void action(async () => {
                  setBlocks(await apiFetch("/community/blocks"));
                  setShowBlocks(!showBlocks);
                })
              }
            >
              Manage blocked users
            </button>
          )}
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">
            {error}
          </p>
        )}
        <Dialog open={showBlocks} onOpenChange={setShowBlocks}>
          <DialogContent className="max-h-[80dvh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle>Blocked users</DialogTitle>
              <DialogDescription>Manage access to Community.</DialogDescription>
            </DialogHeader>
            {!blocks.length && <p>No blocked users.</p>}
            {blocks.map((b) => (
              <div
                key={b.user.id}
                className="flex items-center justify-between"
              >
                <PersonIdentity person={b.user} />
                <button
                  disabled={busy}
                  className={buttonClass}
                  onClick={() =>
                    void action(async () => {
                      await apiFetch(`/community/blocks/${b.user.id}`, {
                        method: "DELETE",
                      });
                      setBlocks(await apiFetch("/community/blocks"));
                    })
                  }
                >
                  Unblock
                </button>
              </div>
            ))}
          </DialogContent>
        </Dialog>
        {blocked ? (
          <p role="alert" className="rounded-xl bg-white p-8">
            You are blocked from Community.
          </p>
        ) : (
          <>
            <section
              aria-label="Community messages"
              className="space-y-4 rounded-xl bg-white p-4 sm:p-6"
            >
              {loading && <p>Loading Community…</p>}
              {!loading && !messages.length && (
                <p>No messages yet. Start the conversation!</p>
              )}
              {hasOlder && (
                <button
                  disabled={busy}
                  className={buttonClass}
                  onClick={() =>
                    void action(async () => {
                      pages.current += 1;
                    })
                  }
                >
                  Load older messages
                </button>
              )}
              {messages.map((m) => {
                const own = m.sender.id === user?.id;
                return (
                  <article
                    key={m.id}
                    className={`flex gap-3 ${own ? "flex-row-reverse" : ""}`}
                  >
                    <button
                      type="button"
                      disabled={
                        user?.role !== "adopter" ||
                        m.sender.role !== "ADOPTER" ||
                        own
                      }
                      onClick={() => setProfile(m.sender.id)}
                      className="self-start disabled:cursor-default"
                    >
                      <AuthenticatedImage
                        src={m.sender.avatar}
                        fallback={fallback}
                        alt={`${m.sender.name}'s profile`}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    </button>
                    <div
                      className={`group relative min-w-0 max-w-[85%] space-y-2 rounded-xl p-3 pr-12 ${own ? "bg-teal-50" : "bg-gray-50"}`}
                    >
                      {!own && (
                        <button
                          disabled={
                            user?.role !== "adopter" ||
                            m.sender.role !== "ADOPTER"
                          }
                          onClick={() => setProfile(m.sender.id)}
                          className="font-semibold disabled:cursor-default"
                        >
                          {m.sender.name}{" "}
                          {m.sender.role === "VET" && (
                            <span className="rounded-full bg-teal-100 px-2 py-1 text-xs text-teal-800">
                              Vet
                            </span>
                          )}
                        </button>
                      )}
                      {m.deletedAt ? (
                        <p className="italic text-gray-500">
                          This message has been deleted.
                        </p>
                      ) : (
                        <>
                          {m.reply && (
                            <blockquote className="border-s-2 border-teal-500 ps-2 text-sm text-gray-500">
                              {m.reply.text}
                            </blockquote>
                          )}
                          {m.text && (
                            <p className="whitespace-pre-wrap break-words">
                              {m.text}
                            </p>
                          )}
                          {m.image && (
                            <AuthenticatedImage
                              src={m.image}
                              alt="Community photo"
                              className="max-h-80 max-w-full rounded-lg object-contain"
                            />
                          )}
                        </>
                      )}
                      <p className="text-xs text-gray-500">
                        {new Date(m.createdAt).toLocaleString()}
                      </p>
                      {(!m.deletedAt || (staff && !own)) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              aria-label="Message options"
                              className="absolute right-2 top-2 !mt-0 rounded-full p-1 text-gray-500 opacity-0 transition-opacity hover:bg-black/5 focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100 data-[state=open]:opacity-100 [@media(hover:none)]:opacity-100"
                            >
                              <ChevronDown size={18} aria-hidden="true" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-white text-gray-800"
                          >
                            {!m.deletedAt && (own || staff) && (
                              <DropdownMenuItem
                                disabled={busy}
                                onSelect={() =>
                                  void action(() =>
                                    apiFetch(`/community/messages/${m.id}`, {
                                      method: "DELETE",
                                    }),
                                  )
                                }
                              >
                                Delete
                              </DropdownMenuItem>
                            )}
                            {!m.deletedAt && (
                              <DropdownMenuItem onSelect={() => setReply(m)}>
                                Reply
                              </DropdownMenuItem>
                            )}
                            {staff && !own && (
                              <DropdownMenuItem
                                disabled={busy}
                                onSelect={() => {
                                  if (
                                    window.confirm(
                                      `Block ${m.sender.name} from Community?`,
                                    )
                                  )
                                    void action(() =>
                                      apiFetch("/community/blocks", {
                                        method: "POST",
                                        body: JSON.stringify({
                                          userId: m.sender.id,
                                        }),
                                      }),
                                    );
                                }}
                              >
                                Block user
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>
            <form
              onSubmit={send}
              className="space-y-2 rounded-xl bg-white p-2 sm:p-3"
            >
              {reply && (
                <div className="flex justify-between text-sm">
                  <span>Replying to {reply.sender.name}</span>
                  <button type="button" onClick={() => setReply(undefined)}>
                    Cancel reply
                  </button>
                </div>
              )}
              {photo && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="truncate">{photo.name}</span>
                  <button
                    type="button"
                    aria-label="Remove attached photo"
                    onClick={() => {
                      setPhoto(undefined);
                      if (input.current) input.current.value = "";
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="relative min-w-0 flex-1">
                  <textarea
                    aria-label="Community message"
                    maxLength={4000}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Write a message…"
                    rows={1}
                    className="block min-h-11 w-full resize-none rounded-full border border-black/10 bg-gray-50 py-3 pl-4 pr-12 text-sm outline-none focus:border-teal-500"
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        !e.shiftKey &&
                        !e.nativeEvent.isComposing
                      ) {
                        e.preventDefault();
                        if (!busy && (text.trim() || photo))
                          e.currentTarget.form?.requestSubmit();
                      }
                    }}
                  />
                  <button
                    type="button"
                    aria-label="Upload photo"
                    title="Upload photo (PNG, JPEG, WebP; max 5 MB)"
                    onClick={() => input.current?.click()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-teal-700 hover:bg-teal-100"
                  >
                    <Plus size={20} />
                  </button>
                  <input
                    ref={input}
                    type="file"
                    aria-label="Community photo"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && file.size > 5 * 1024 * 1024) {
                        setError("Photos must be 5 MB or smaller");
                        e.target.value = "";
                        setPhoto(undefined);
                      } else setPhoto(file);
                    }}
                  />
                </div>
                <button
                  type="submit"
                  aria-label="Send"
                  disabled={busy || (!text.trim() && !photo)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#089D97] text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  <ArrowUp size={22} />
                </button>
              </div>
            </form>
          </>
        )}
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
