import { useText } from "../i18n/useText";
import { SOCKET_EVENTS } from "@shared/events/socket.events";
import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { ApiError, apiFetch } from "../lib/api";
import {
  buttonClass,
  Person,
  PersonIdentity,
  PublicProfile,
} from "./CommunityPage";
type Friend = {
  id: string;
  friend: Person;
  online: boolean;
  lastSeenAt?: string;
};
type Request = {
  id: string;
  senderId: string;
  recipientId: string;
  user: Person;
};
export default function FriendsPage({
  onNavigate,
}: {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}) {
  const tx = useText();
  const { user } = useAuth();
  const [tab, setTab] = useState<"friends" | "requests">("friends");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Person[]>([]);
  const [searching, setSearching] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try {
      const [f, r] = await Promise.all([
        apiFetch<Friend[]>("/friends"),
        apiFetch<Request[]>("/friend-requests"),
      ]);
      setFriends(f);
      setRequests(r);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const t = setInterval(refresh, 5000);
    function presence(event: Event) {
      const { userId, online } = (event as CustomEvent<{ userId: string; online: boolean }>).detail;
      setFriends((rows) => rows.map((row) => row.friend.id === userId ? { ...row, online } : row));
    }
    window.addEventListener(`petopia:${SOCKET_EVENTS.FRIEND_PRESENCE}`, presence);
    window.addEventListener("petopia:realtime-connected", refresh);
    return () => {
      clearInterval(t);
      window.removeEventListener(`petopia:${SOCKET_EVENTS.FRIEND_PRESENCE}`, presence);
      window.removeEventListener("petopia:realtime-connected", refresh);
    };
  }, [refresh]);
  useEffect(() => {
    let active = true;
    setResults([]);
    if (!search.trim()) {
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      apiFetch<Person[]>(
        `/adopters/search?name=${encodeURIComponent(search.trim())}`,
      )
        .then((rows) => {
          if (active) setResults(rows);
        })
        .catch((e) => {
          if (active) setError(e.message);
        })
        .finally(() => {
          if (active) setSearching(false);
        });
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);
  async function act(work: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await work();
      await refresh();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        await refresh();
        return;
      }
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <DashboardLayout
      role="adopter"
      activePage="friends"
      onNavigate={onNavigate}
      pageTitle={tx("Friends")}
    >
      <div className="w-full space-y-6 pb-20">
        <div
          role="tablist"
          aria-label={tx("Friends views")}
          className="inline-flex gap-1 rounded-full bg-white/60 p-1"
        >
          {(["friends", "requests"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              id={`${value}-tab`}
              aria-controls={`${value}-panel`}
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${tab === value ? "bg-[#089D97] text-white shadow-sm" : "text-gray-600 hover:bg-white"}`}
            >
              {value === "friends" ? tx("Friends") : tx("Requests")}
            </button>
          ))}
        </div>
        {tab === "friends" && (
          <input
            type="search"
            aria-label={tx("Search adopters by name")}
            placeholder={tx("Search adopters by name to find friends…")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500"
          />
        )}
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        {loading && <p>{tx("Loading friends…")}</p>}
        {tab === "requests" && (
          <section
            role="tabpanel"
            id="requests-panel"
            aria-labelledby="requests-tab"
            className="space-y-4"
          >
            {!loading && !requests.length && (
              <p>{tx("You don't have any pending requests.")}</p>
            )}
            {requests.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b pb-3"
              >
                <PersonIdentity
                  person={r.user}
                  onClick={() => setProfile(r.user.id)}
                />
                <div className="flex gap-2">
                  {(r.recipientId === user?.id
                    ? ["accept", "reject"]
                    : ["cancel"]
                  ).map((action) => (
                    <button
                      key={action}
                      disabled={busy}
                      className={buttonClass}
                      onClick={() =>
                        void act(() =>
                          apiFetch(`/friend-requests/${r.id}`, {
                            method: "PATCH",
                            body: JSON.stringify({ action }),
                          }),
                        )
                      }
                    >
                      {tx(action[0].toUpperCase() + action.slice(1))}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}
        {tab === "friends" && (
          <section
            role="tabpanel"
            id="friends-panel"
            aria-labelledby="friends-tab"
            className="space-y-4"
          >
            {!loading && !search.trim() && !friends.length && (
              <p>{tx("You don't have any friends yet.")}</p>
            )}
            {friends
              .filter((f) =>
                f.friend.name
                  .toLowerCase()
                  .includes(search.trim().toLowerCase()),
              )
              .map((f) => (
                <div
                  key={f.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b pb-3"
                >
                  <div>
                    <PersonIdentity
                      person={f.friend}
                      onClick={() => setProfile(f.friend.id)}
                    />
                    <p
                      className={`mt-1 text-sm ${f.online ? "text-green-700" : "text-gray-500"}`}
                    >
                      {f.online ? tx("● Online") : tx("○ Offline")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={buttonClass} onClick={() => setProfile(f.friend.id)}>
                      {tx("View profile")}
                    </button>
                    <button
                      disabled={busy}
                      className={buttonClass}
                      onClick={() =>
                        void act(async () => {
                          const c = await apiFetch<{ id: string }>(
                            "/direct-conversations",
                            {
                              method: "POST",
                              body: JSON.stringify({ userId: f.friend.id }),
                            },
                          );
                          onNavigate("chats", { id: c.id });
                        })
                      }
                    >{tx("Chat")}</button>
                    <button
                      disabled={busy}
                      className={buttonClass}
                      onClick={() => {
                        if (
                          window.confirm(
                            tx("Remove {name} from friends?", { name: f.friend.name }),
                          )
                        )
                          void act(() =>
                            apiFetch(`/friends/${f.friend.id}`, {
                              method: "DELETE",
                            }),
                          );
                      }}
                    >{tx("Remove friend")}</button>
                  </div>
                </div>
              ))}
            {search.trim() && (
              <>
                {searching && (
                  <p className="text-sm text-gray-500">{tx("Searching adopters…")}</p>
                )}
                {!searching &&
                  !results.length &&
                  !friends.some((f) =>
                    f.friend.name
                      .toLowerCase()
                      .includes(search.trim().toLowerCase()),
                  ) && <p>{tx("No adopters found.")}</p>}
                {results
                  .filter((p) => !friends.some((f) => f.friend.id === p.id))
                  .map((person) => {
                    const pending = requests.find(
                      (r) => r.user.id === person.id,
                    );
                    return (
                      <div
                        key={person.id}
                        className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 py-3"
                      >
                        <PersonIdentity
                          person={person}
                          onClick={() => setProfile(person.id)}
                        />
                        {pending ? (
                          <button
                            className={buttonClass}
                            onClick={() => setTab("requests")}
                          >
                            {pending.recipientId === user?.id
                              ? tx("Respond to request")
                              : tx("Request sent")}
                          </button>
                        ) : (
                          <button
                            className={buttonClass}
                            disabled={busy}
                            onClick={() =>
                              void act(() =>
                                apiFetch("/friend-requests", {
                                  method: "POST",
                                  body: JSON.stringify({ userId: person.id }),
                                }),
                              )
                            }
                          >{tx("Add friend")}</button>
                        )}
                      </div>
                    );
                  })}
              </>
            )}
          </section>
        )}
        {profile && (
          <PublicProfile
            key={profile}
            id={profile}
            onFriendshipChange={() => { void refresh(); }}
            onClose={() => setProfile(undefined)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
