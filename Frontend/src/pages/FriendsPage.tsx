import { useCallback, useEffect, useMemo, useState } from "react";
import { LockKeyhole, RefreshCw, Search, UserMinus, UserPlus, Users } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import EmptyState from "../components/EmptyState";
import AuthenticatedImage from "../components/AuthenticatedImage";
import { apiFetch } from "../lib/api";
import { useLanguage } from "../context/LanguageContext";
import type { UserRole } from "../context/AuthContext";
import profileImg from "../imports/MyPetopia/0ade9078bed97f834442fbb8c3bc4424aaf43269.png";

type StaffRole = Extract<UserRole, "employee" | "vet" | "manager" | "admin">;

interface FriendUser {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string | null;
  role?: { roleName?: string } | null;
  employeeProfile?: {
    department?: { departmentName?: string } | null;
  } | null;
}

interface Friendship {
  friendshipId: string;
  isSystemGenerated: boolean;
  createdAt: string;
  friend: FriendUser;
}

interface FriendsPageProps {
  onNavigate: (page: string) => void;
  role: StaffRole;
  activePage: string;
}

type View = "friends" | "candidates";

function displayName(user: FriendUser) {
  return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;
}

function matchesSearch(user: FriendUser, search: string) {
  const value = search.trim().toLowerCase();
  if (!value) return true;
  return [displayName(user), user.email, user.role?.roleName, user.employeeProfile?.department?.departmentName]
    .some((field) => field?.toLowerCase().includes(value));
}

export default function FriendsPage({ onNavigate, role, activePage }: FriendsPageProps) {
  const { t } = useLanguage();
  const canManage = role === "employee" || role === "vet";
  const [view, setView] = useState<View>("friends");
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [candidates, setCandidates] = useState<FriendUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionUserId, setActionUserId] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [friendList, candidateList] = await Promise.all([
        apiFetch<Friendship[]>("/users/friends"),
        canManage ? apiFetch<FriendUser[]>("/users/friends/candidates") : Promise.resolve([]),
      ]);
      setFriends(friendList);
      setCandidates(candidateList);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("friends_load_error"));
    } finally {
      setLoading(false);
    }
  }, [canManage, t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredFriends = useMemo(
    () => friends.filter((friendship) => matchesSearch(friendship.friend, search)),
    [friends, search],
  );
  const filteredCandidates = useMemo(
    () => candidates.filter((candidate) => matchesSearch(candidate, search)),
    [candidates, search],
  );

  async function addFriend(user: FriendUser) {
    setActionUserId(user.userId);
    setError("");
    try {
      await apiFetch(`/users/friends/${user.userId}`, { method: "POST" });
      await loadData();
      setView("friends");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("friends_add_error"));
    } finally {
      setActionUserId("");
    }
  }

  async function removeFriend(friendship: Friendship) {
    setActionUserId(friendship.friend.userId);
    setError("");
    try {
      await apiFetch(`/users/friends/${friendship.friend.userId}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("friends_remove_error"));
    } finally {
      setActionUserId("");
    }
  }

  const shownUsers = view === "friends" ? filteredFriends.map((item) => item.friend) : filteredCandidates;

  return (
    <DashboardLayout
      role={role}
      activePage={activePage}
      onNavigate={onNavigate}
      pageTitle={t("friends_title")}
      breadcrumbs={[t("friends_title")]}
    >
      <div className="space-y-4 font-['Poppins',sans-serif]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {canManage ? (
            <div className="inline-flex w-full sm:w-auto rounded-[8px] border border-black/10 bg-white p-1" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={view === "friends"}
                onClick={() => { setView("friends"); setSearch(""); }}
                className={`flex min-w-0 flex-1 sm:flex-none items-center justify-center gap-2 rounded-[6px] px-4 py-2 text-[14px] font-medium transition-colors ${view === "friends" ? "bg-[#089D97] text-white" : "text-black/65 hover:bg-black/5"}`}
              >
                <Users size={17} />
                <span className="truncate">{t("friends_all")} ({friends.length})</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={view === "candidates"}
                onClick={() => { setView("candidates"); setSearch(""); }}
                className={`flex min-w-0 flex-1 sm:flex-none items-center justify-center gap-2 rounded-[6px] px-4 py-2 text-[14px] font-medium transition-colors ${view === "candidates" ? "bg-[#089D97] text-white" : "text-black/65 hover:bg-black/5"}`}
              >
                <UserPlus size={17} />
                <span className="truncate">{t("friends_add")} ({candidates.length})</span>
              </button>
            </div>
          ) : <div />}

          <div className="relative w-full sm:w-[300px]">
            <Search size={17} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-black/40" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("friends_search")}
              className="h-10 w-full rounded-[8px] border border-black/15 bg-white ps-10 pe-3 text-[14px] outline-none transition-colors focus:border-[#089D97]"
            />
          </div>
        </div>

        {error && (
          <div className="flex flex-col gap-3 rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700 sm:flex-row sm:items-center sm:justify-between">
            <span className="break-words">{error}</span>
            <button type="button" onClick={() => void loadData()} className="inline-flex shrink-0 items-center gap-2 self-start font-semibold hover:text-red-900 sm:self-auto">
              <RefreshCw size={15} /> {t("friends_retry")}
            </button>
          </div>
        )}

        <div className="overflow-hidden rounded-[8px] border border-black/10 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-[260px] items-center justify-center gap-3 text-[14px] text-black/55">
              <RefreshCw size={19} className="animate-spin text-[#089D97]" />
              {t("common_loading")}
            </div>
          ) : shownUsers.length === 0 ? (
            <EmptyState
              icon={view === "friends" ? <Users size={28} /> : <UserPlus size={28} />}
              title={t(view === "friends" ? "friends_empty" : "friends_candidates_empty")}
            />
          ) : (
            <div className="divide-y divide-black/10">
              {view === "friends" ? filteredFriends.map((friendship) => (
                <FriendRow
                  key={friendship.friendshipId}
                  user={friendship.friend}
                  label={friendship.isSystemGenerated ? t("friends_system") : t("friends_manual")}
                  systemGenerated={friendship.isSystemGenerated}
                  action={canManage && !friendship.isSystemGenerated ? (
                    <button
                      type="button"
                      title={t("friends_remove_action")}
                      aria-label={`${t("friends_remove_action")} ${displayName(friendship.friend)}`}
                      disabled={actionUserId === friendship.friend.userId}
                      onClick={() => void removeFriend(friendship)}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-red-200 text-red-600 transition-colors hover:bg-red-50 disabled:cursor-wait disabled:opacity-50"
                    >
                      {actionUserId === friendship.friend.userId ? <RefreshCw size={17} className="animate-spin" /> : <UserMinus size={17} />}
                    </button>
                  ) : friendship.isSystemGenerated ? <LockKeyhole size={17} className="shrink-0 text-black/30" aria-label={t("friends_system")} /> : undefined}
                />
              )) : filteredCandidates.map((candidate) => (
                <FriendRow
                  key={candidate.userId}
                  user={candidate}
                  action={(
                    <button
                      type="button"
                      title={t("friends_add_action")}
                      aria-label={`${t("friends_add_action")} ${displayName(candidate)}`}
                      disabled={actionUserId === candidate.userId}
                      onClick={() => void addFriend(candidate)}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#089D97] text-white transition-colors hover:bg-[#047975] disabled:cursor-wait disabled:opacity-50"
                    >
                      {actionUserId === candidate.userId ? <RefreshCw size={17} className="animate-spin" /> : <UserPlus size={17} />}
                    </button>
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function FriendRow({ user, label, systemGenerated = false, action }: { user: FriendUser; label?: string; systemGenerated?: boolean; action?: React.ReactNode }) {
  const { t } = useLanguage();
  const roleKey = `role_${(user.role?.roleName ?? "employee").toLowerCase()}`;
  const translatedRole = t(roleKey);
  const roleLabel = translatedRole === roleKey ? user.role?.roleName : translatedRole;

  return (
    <div className="flex min-w-0 items-center gap-3 px-4 py-4 sm:px-5">
      <AuthenticatedImage src={user.avatar} fallback={profileImg} alt="" className="h-11 w-11 shrink-0 rounded-full border border-black/10 object-cover" />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <p className="max-w-full truncate text-[15px] font-semibold text-[#1a2e2d]">{displayName(user)}</p>
          {label && (
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${systemGenerated ? "border-blue-200 bg-blue-50 text-blue-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
              {systemGenerated && <LockKeyhole size={10} />}
              {label}
            </span>
          )}
        </div>
        <p className="truncate text-[13px] text-black/55">{user.email}</p>
        <p className="mt-0.5 truncate text-[12px] text-black/45">
          {[roleLabel, user.employeeProfile?.department?.departmentName].filter(Boolean).join(" · ")}
        </p>
      </div>
      {action}
    </div>
  );
}
