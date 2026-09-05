import { useEffect, useMemo, useState } from "react";
import { Search, Edit, Trash2, Eye, RefreshCw } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import Badge, { statusBadge } from "../../components/Badge";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import EmptyState from "../../components/EmptyState";
import { apiFetch, resolveAssetUrl } from "../../lib/api";
import type { UserRole } from "../../context/AuthContext";
import profileImg from "../../imports/MyPetopia/0ade9078bed97f834442fbb8c3bc4424aaf43269.png";

interface UserRecord {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string | null;
  phone?: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  role: { roleId: string; roleName: string };
  employeeProfile?: {
    departmentId?: string | null;
    salary?: string | number | null;
    hireDate?: string | null;
    address?: string | null;
    department?: { departmentId: string; departmentName: string } | null;
  } | null;
}

const roleLabel = (roleName?: string) => {
  const normalized = (roleName ?? "ADOPTER").toUpperCase();
  if (normalized === "EMPLOYEE") return "staff";
  return normalized.toLowerCase();
};

interface AdminUsersPageProps { onNavigate: (page: string) => void; role?: Extract<UserRole, "admin" | "manager">; activePage?: string; }

export default function AdminUsersPage({ onNavigate, role = "admin", activePage = "admin-users" }: AdminUsersPageProps) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [viewUser, setViewUser] = useState<UserRecord | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserRecord | null>(null);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [editForm, setEditForm] = useState({ roleId: "", status: "active" });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const canDelete = role === "admin";

  const roleOptions = useMemo(() => {
    const roles = new Map<string, string>();
    users.forEach((user) => {
      if (user.role?.roleId && user.role?.roleName) roles.set(user.role.roleId, roleLabel(user.role.roleName));
    });
    return Array.from(roles, ([roleId, label]) => ({ roleId, label })).filter((role) => role.label !== "admin");
  }, [users]);

  const filterRoles = ["all", ...Array.from(new Set(users.map((u) => roleLabel(u.role?.roleName))))];
  const filtered = users.filter((u) => {
    const name = `${u.firstName} ${u.lastName}`.toLowerCase();
    const ms = name.includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const mr = roleFilter === "all" || roleLabel(u.role?.roleName) === roleFilter;
    const mt = statusFilter === "all" || u.status === statusFilter;
    return ms && mr && mt;
  });

  function loadUsers() {
    setLoading(true);
    setError("");
    apiFetch<UserRecord[]>(`/users?status=${statusFilter}`)
      .then(setUsers)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load users."))
      .finally(() => setLoading(false));
  }

  useEffect(loadUsers, [statusFilter]);

  async function openView(user: UserRecord) {
    setViewUser(user);
    try {
      setViewUser(await apiFetch<UserRecord>(`/users/${user.userId}`));
    } catch {
      setViewUser(user);
    }
  }

  function openEdit(user: UserRecord) {
    setEditUser(user);
    setEditForm({ roleId: user.role.roleId, status: user.status });
    setFormError("");
  }

  async function saveUser() {
    if (!editUser) return;
    setSaving(true);
    setFormError("");
    const body: { status?: string; roleId?: string } = { status: editForm.status };
    if (editForm.roleId && editForm.roleId !== editUser.role.roleId) body.roleId = editForm.roleId;
    try {
      await apiFetch(`/users/${editUser.userId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setEditUser(null);
      loadUsers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to update user.");
    } finally {
      setSaving(false);
    }
  }

  async function deactivateUser() {
    if (!deleteUser) return;
    setSaving(true);
    try {
      await apiFetch(`/users/${deleteUser.userId}`, { method: "DELETE" });
      setDeleteUser(null);
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to deactivate user.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout role={role} activePage={activePage} onNavigate={onNavigate} pageTitle="User Management" breadcrumbs={[role === "admin" ? "Admin" : "Manager", "Users"]}>
      <div className="bg-white rounded-[15px] shadow-md p-5">
        <div className="flex flex-wrap gap-3 mb-5 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#089D97]" />
            <input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-[10px] font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {filterRoles.map((r) => (
              <button key={r} onClick={() => setRoleFilter(r)} className={`px-3 py-1.5 rounded-[20px] font-['Poppins',sans-serif] text-[12px] capitalize transition-colors ${roleFilter === r ? "bg-[#089D97] text-white" : "bg-gray-100 text-black/70 hover:bg-gray-200"}`}>{r}</button>
            ))}
          </div>
          <button onClick={loadUsers} className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-black/60 rounded-[10px] font-['Poppins',sans-serif] text-[12px] hover:bg-gray-50 transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <div className="flex gap-2 flex-wrap mb-4">
          {["active", "inactive", "all"].map((status) => (
            <button key={status} onClick={() => setStatusFilter(status)} className={`px-3 py-1.5 rounded-[20px] font-['Poppins',sans-serif] text-[12px] capitalize transition-colors ${statusFilter === status ? "bg-[#089D97] text-white" : "bg-gray-100 text-black/70 hover:bg-gray-200"}`}>{status}</button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">{[1, 2, 3, 4, 5].map((n) => <div key={n} className="h-[58px] rounded-[10px] bg-gray-50 animate-pulse" />)}</div>
        ) : error ? (
          <EmptyState icon={<Search size={28} />} title="Unable to load users" description={error} actionLabel="Try again" onAction={loadUsers} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Search size={28} />} title="No users found" description="No users match your filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  {["User", "Email", "Role", "Status", "Joined", "Last Active", "Actions"].map((h) => (
                    <th key={h} className="py-2.5 px-3 font-['Poppins',sans-serif] font-semibold text-[11px] text-black/50 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.userId} className="border-b border-gray-50 hover:bg-[rgba(8,157,151,0.03)] transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[rgba(8,157,151,0.15)] overflow-hidden shrink-0 flex items-center justify-center">
                          <img src={u.avatar ? resolveAssetUrl(u.avatar) : profileImg} alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-['Poppins',sans-serif] font-medium text-[13px] text-black whitespace-nowrap">{u.firstName} {u.lastName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/60">{u.email}</td>
                    <td className="py-3 px-3"><Badge label={roleLabel(u.role?.roleName)} variant={statusBadge(roleLabel(u.role?.roleName))} /></td>
                    <td className="py-3 px-3"><Badge label={u.status} variant={statusBadge(u.status)} /></td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/60">{u.createdAt?.slice(0, 10) ?? "-"}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/60">{u.updatedAt?.slice(0, 10) ?? "-"}</td>
                    <td className="py-3 px-3">
                      <div className="flex gap-2">
                        <button onClick={() => openView(u)} className="text-[#089D97] hover:text-[#047975] transition-colors"><Eye size={15} /></button>
                        <button onClick={() => openEdit(u)} className="text-blue-400 hover:text-blue-600 transition-colors"><Edit size={15} /></button>
                        {canDelete && <button onClick={() => setDeleteUser(u)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <p className="font-['Poppins',sans-serif] text-[12px] text-black/40">{filtered.length} users found</p>
          <Pagination page={page} totalPages={1} onPage={setPage} />
        </div>
      </div>

      <Modal title="User Details" open={!!viewUser} onClose={() => setViewUser(null)} size="sm">
        {viewUser && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-12 h-12 rounded-full bg-[rgba(8,157,151,0.15)] overflow-hidden">
                <img src={viewUser.avatar ? resolveAssetUrl(viewUser.avatar) : profileImg} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black">{viewUser.firstName} {viewUser.lastName}</p>
                <Badge label={roleLabel(viewUser.role?.roleName)} variant={statusBadge(roleLabel(viewUser.role?.roleName))} />
              </div>
            </div>
            {[["Email", viewUser.email], ["Phone", viewUser.phone ?? "-"], ["Status", viewUser.status], ["Department", viewUser.employeeProfile?.department?.departmentName ?? "-"], ["Joined", viewUser.createdAt?.slice(0, 10) ?? "-"], ["Last Active", viewUser.updatedAt?.slice(0, 10) ?? "-"]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 text-[13px] font-['Poppins',sans-serif] border-b border-gray-50 pb-2">
                <span className="text-black/50">{k}</span>
                <span className="font-medium text-black text-right">{v}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal title="Edit User" open={!!editUser} onClose={() => setEditUser(null)} onConfirm={saveUser} confirmLabel={saving ? "Saving..." : "Save Changes"} size="sm">
        {editUser && (
          <div className="space-y-4">
            {formError && <p className="text-[13px] text-red-600 bg-red-50 rounded-[10px] px-3 py-2">{formError}</p>}
            <div>
              <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">Role</label>
              <select value={editForm.roleId} onChange={(e) => setEditForm((form) => ({ ...form, roleId: e.target.value }))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] bg-white outline-none focus:border-[#089D97] transition-colors">
                {roleOptions.map((r) => <option key={r.roleId} value={r.roleId}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">Status</label>
              <select value={editForm.status} onChange={(e) => setEditForm((form) => ({ ...form, status: e.target.value }))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] bg-white outline-none focus:border-[#089D97] transition-colors">
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </div>
          </div>
        )}
      </Modal>

      <Modal title="Deactivate User" open={!!deleteUser} onClose={() => setDeleteUser(null)} onConfirm={deactivateUser} confirmLabel={saving ? "Deactivating..." : "Deactivate"} confirmDestructive size="sm">
        <p className="font-['Poppins',sans-serif] text-[14px] text-black">
          Deactivate <span className="font-semibold">{deleteUser?.firstName} {deleteUser?.lastName}</span>?
        </p>
      </Modal>
    </DashboardLayout>
  );
}
