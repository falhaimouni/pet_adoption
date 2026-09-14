import { useEffect, useMemo, useState } from "react";
import { Search, Edit, Trash2, Eye, RefreshCw, UserPlus } from "lucide-react";
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

interface RoleOption {
  roleId: string;
  roleName: string;
}

interface DepartmentOption {
  departmentId: string;
  departmentName: string;
}

type LookupResponse<T> = T[] | { data?: T[]; items?: T[]; roles?: T[]; departments?: T[] };

const blankEmployee = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  roleId: "",
  departmentId: "",
  hireDate: "",
  salary: "",
  address: "",
  status: "active",
};

const roleLabel = (roleName?: string) => {
  const normalized = (roleName ?? "ADOPTER").toUpperCase();
  if (normalized === "EMPLOYEE") return "staff";
  return normalized.toLowerCase();
};

const ASSIGNABLE_EMPLOYEE_ROLES = new Set(["MANAGER", "EMPLOYEE", "VET"]);
const ROLE_RANK: Record<string, number> = {
  ADMIN: 4,
  MANAGER: 3,
  EMPLOYEE: 2,
  VET: 2,
  ADOPTER: 1,
};

function canManageUser(currentRole: "admin" | "manager", targetRoleName?: string) {
  const currentRank = ROLE_RANK[currentRole.toUpperCase()] ?? 0;
  const targetRank = ROLE_RANK[targetRoleName?.toUpperCase() ?? ""] ?? 0;
  return currentRank > targetRank;
}

function normalizeLookup<T>(value: LookupResponse<T>, key: "roles" | "departments"): T[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.data)) return value.data;
  if (Array.isArray(value.items)) return value.items;
  if (Array.isArray(value[key])) return value[key] as T[];
  return [];
}

function roleFallbackFromUsers(users: UserRecord[]): RoleOption[] {
  const roles = new Map<string, string>();
  users.forEach((user) => {
    const roleName = user.role?.roleName?.toUpperCase();
    if (user.role?.roleId && roleName && ASSIGNABLE_EMPLOYEE_ROLES.has(roleName)) {
      roles.set(user.role.roleId, roleName);
    }
  });
  return Array.from(roles, ([roleId, roleName]) => ({ roleId, roleName })).sort((a, b) => a.roleName.localeCompare(b.roleName));
}

function departmentFallbackFromUsers(users: UserRecord[]): DepartmentOption[] {
  const departments = new Map<string, string>();
  users.forEach((user) => {
    const department = user.employeeProfile?.department;
    if (department?.departmentId && department.departmentName) {
      departments.set(department.departmentId, department.departmentName);
    }
  });
  return Array.from(departments, ([departmentId, departmentName]) => ({ departmentId, departmentName })).sort((a, b) => a.departmentName.localeCompare(b.departmentName));
}

function randomChar(chars: string): string {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return chars[values[0] % chars.length];
}

function shuffle(value: string): string {
  const chars = value.split("");
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    const j = values[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

function generateStrongPassword(): string {
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const symbols = "!@#$%^&*()-_=+";
  const all = lower + upper + digits + symbols;
  const required = [
    randomChar(lower),
    randomChar(upper),
    randomChar(digits),
    randomChar(symbols),
  ];
  while (required.length < 18) required.push(randomChar(all));
  return shuffle(required.join(""));
}

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
  const [employeeOpen, setEmployeeOpen] = useState(false);
  const [employeeForm, setEmployeeForm] = useState(blankEmployee);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [lookupsLoading, setLookupsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const canDelete = role === "admin";
  const canCreateEmployee = role === "admin";

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

  async function loadEmployeeLookups() {
    if (!canCreateEmployee || lookupsLoading) return;
    setLookupsLoading(true);
    setFormError("");
    try {
      const [roleList, departmentList] = await Promise.all([
        apiFetch<LookupResponse<RoleOption>>("/roles"),
        apiFetch<LookupResponse<DepartmentOption>>("/departments?active=true"),
      ]);
      const lookupRoles = normalizeLookup(roleList, "roles").filter((item) => item.roleId && ASSIGNABLE_EMPLOYEE_ROLES.has(item.roleName?.toUpperCase()));
      const lookupDepartments = normalizeLookup(departmentList, "departments").filter((item) => item.departmentId && item.departmentName);
      const nextRoles = lookupRoles.length > 0 ? lookupRoles : roleFallbackFromUsers(users);
      const nextDepartments = lookupDepartments.length > 0 ? lookupDepartments : departmentFallbackFromUsers(users);
      setRoles(nextRoles);
      setDepartments(nextDepartments);
      if (nextRoles.length === 0 || nextDepartments.length === 0) {
        setFormError("No active assignable roles or departments were returned by the backend.");
      }
      setEmployeeForm((form) => ({
        ...form,
        roleId: form.roleId || nextRoles[0]?.roleId || "",
        departmentId: form.departmentId || nextDepartments[0]?.departmentId || "",
      }));
    } catch (err) {
      const nextRoles = roleFallbackFromUsers(users);
      const nextDepartments = departmentFallbackFromUsers(users);
      setRoles(nextRoles);
      setDepartments(nextDepartments);
      setEmployeeForm((form) => ({
        ...form,
        roleId: form.roleId || nextRoles[0]?.roleId || "",
        departmentId: form.departmentId || nextDepartments[0]?.departmentId || "",
      }));
      setFormError(
        nextRoles.length > 0 && nextDepartments.length > 0
          ? "Lookup endpoints failed, so the dropdowns are using role and department values from loaded backend users."
          : err instanceof Error ? err.message : "Unable to load roles and departments.",
      );
    } finally {
      setLookupsLoading(false);
    }
  }

  function openEmployeeCreate() {
    setEmployeeForm(blankEmployee);
    setEmployeeOpen(true);
    setFormError("");
    void loadEmployeeLookups();
  }

  async function openView(user: UserRecord) {
    setViewUser(user);
    try {
      setViewUser(await apiFetch<UserRecord>(`/users/${user.userId}`));
    } catch {
      setViewUser(user);
    }
  }

  function openEdit(user: UserRecord) {
    if (!canManageUser(role, user.role?.roleName)) {
      setFormError("You can only edit lower-role users.");
      return;
    }
    setEditUser(user);
    setEditForm({ roleId: user.role.roleId, status: user.status });
    setFormError("");
  }

  async function saveUser() {
    if (!editUser) return;
    if (!canManageUser(role, editUser.role?.roleName)) {
      setFormError("You can only edit lower-role users.");
      return;
    }
    setSaving(true);
    setFormError("");
    const body: { status?: string; roleId?: string } = { status: editForm.status };
    if (role === "admin" && editForm.roleId && editForm.roleId !== editUser.role.roleId) body.roleId = editForm.roleId;
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

  async function createEmployee() {
    if (!canCreateEmployee) return;
    const required = [employeeForm.firstName, employeeForm.lastName, employeeForm.email, employeeForm.roleId, employeeForm.departmentId, employeeForm.hireDate];
    if (required.some((value) => !String(value ?? "").trim())) {
      setFormError("First name, last name, email, role, department, and hire date are required.");
      return;
    }
    if (!roles.some((item) => item.roleId === employeeForm.roleId) || !departments.some((item) => item.departmentId === employeeForm.departmentId)) {
      setFormError("Choose a valid active role and department before creating the employee.");
      return;
    }
    if (employeeForm.salary && Number(employeeForm.salary) < 0) {
      setFormError("Salary must be a non-negative number.");
      return;
    }
    const body = {
      firstName: employeeForm.firstName.trim(),
      lastName: employeeForm.lastName.trim(),
      email: employeeForm.email.trim(),
      password: generateStrongPassword(),
      roleId: employeeForm.roleId,
      departmentId: employeeForm.departmentId,
      hireDate: employeeForm.hireDate,
      phone: employeeForm.phone.trim() || undefined,
      salary: employeeForm.salary === "" ? undefined : Number(employeeForm.salary),
      address: employeeForm.address.trim() || undefined,
      status: employeeForm.status || undefined,
    };
    setSaving(true);
    setFormError("");
    try {
      await apiFetch("/users/employees", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setEmployeeOpen(false);
      setEmployeeForm(blankEmployee);
      loadUsers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to create employee.");
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
          {canCreateEmployee && (
            <button onClick={openEmployeeCreate} className="flex items-center gap-2 px-4 py-2 bg-[#089D97] text-white rounded-[10px] font-['Poppins',sans-serif] text-[12px] font-medium hover:bg-[#047975] transition-colors">
              <UserPlus size={14} /> Add Employee
            </button>
          )}
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
                {filtered.map((u) => {
                  const canManageRow = canManageUser(role, u.role?.roleName);
                  return (
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
                        {canManageRow && <button onClick={() => openEdit(u)} className="text-blue-400 hover:text-blue-600 transition-colors"><Edit size={15} /></button>}
                        {canDelete && canManageRow && <button onClick={() => setDeleteUser(u)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>}
                      </div>
                    </td>
                  </tr>
                  );
                })}
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
            {role === "admin" ? (
              <div>
                <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">Role</label>
                <select value={editForm.roleId} onChange={(e) => setEditForm((form) => ({ ...form, roleId: e.target.value }))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] bg-white outline-none focus:border-[#089D97] transition-colors">
                  {roleOptions.map((r) => <option key={r.roleId} value={r.roleId}>{r.label}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">Role</label>
                <p className="w-full rounded-[10px] bg-gray-50 px-3 py-2 font-['Poppins',sans-serif] text-[13px] text-black/60">{roleLabel(editUser.role?.roleName)}</p>
              </div>
            )}
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

      <Modal title="Add Employee" open={employeeOpen} onClose={() => setEmployeeOpen(false)} onConfirm={createEmployee} confirmLabel={saving ? "Creating..." : "Generate Password"} size="md">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {formError && <p className="sm:col-span-2 text-[13px] text-red-600 bg-red-50 rounded-[10px] px-3 py-2">{formError}</p>}
          {lookupsLoading && <p className="sm:col-span-2 text-[13px] text-black/50 bg-gray-50 rounded-[10px] px-3 py-2">Loading roles and departments...</p>}
          <Field label="First Name" value={employeeForm.firstName} onChange={(value) => setEmployeeForm((form) => ({ ...form, firstName: value }))} />
          <Field label="Last Name" value={employeeForm.lastName} onChange={(value) => setEmployeeForm((form) => ({ ...form, lastName: value }))} />
          <Field label="Email" type="email" value={employeeForm.email} onChange={(value) => setEmployeeForm((form) => ({ ...form, email: value }))} />
          <p className="sm:col-span-2 font-['Poppins',sans-serif] text-[12px] text-black/50 bg-[#f0f8f7] rounded-[10px] px-3 py-2">
            Use Generate Password to create the account with a strong internal password. The password is never displayed or stored in the UI.
          </p>
          <div>
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">Role</label>
            <select value={employeeForm.roleId} onChange={(e) => setEmployeeForm((form) => ({ ...form, roleId: e.target.value }))} disabled={lookupsLoading || roles.length === 0} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] bg-white outline-none focus:border-[#089D97] transition-colors disabled:opacity-60">
              <option value="">{lookupsLoading ? "Loading roles..." : roles.length === 0 ? "No assignable roles" : "Choose role"}</option>
              {roles.map((r) => <option key={r.roleId} value={r.roleId}>{roleLabel(r.roleName)}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">Department</label>
            <select value={employeeForm.departmentId} onChange={(e) => setEmployeeForm((form) => ({ ...form, departmentId: e.target.value }))} disabled={lookupsLoading || departments.length === 0} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] bg-white outline-none focus:border-[#089D97] transition-colors disabled:opacity-60">
              <option value="">{lookupsLoading ? "Loading departments..." : departments.length === 0 ? "No active departments" : "Choose department"}</option>
              {departments.map((d) => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
            </select>
          </div>
          <Field label="Hire Date" type="date" value={employeeForm.hireDate} onChange={(value) => setEmployeeForm((form) => ({ ...form, hireDate: value }))} />
          <Field label="Phone" value={employeeForm.phone} onChange={(value) => setEmployeeForm((form) => ({ ...form, phone: value }))} />
          <Field label="Salary" type="number" value={employeeForm.salary} onChange={(value) => setEmployeeForm((form) => ({ ...form, salary: value }))} />
          <div>
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">Status</label>
            <select value={employeeForm.status} onChange={(e) => setEmployeeForm((form) => ({ ...form, status: e.target.value }))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] bg-white outline-none focus:border-[#089D97] transition-colors">
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">Address</label>
            <textarea value={employeeForm.address} onChange={(e) => setEmployeeForm((form) => ({ ...form, address: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] resize-none transition-colors" />
          </div>
        </div>
      </Modal>

      <Modal title="Deactivate User" open={!!deleteUser} onClose={() => setDeleteUser(null)} onConfirm={deactivateUser} confirmLabel={saving ? "Deactivating..." : "Deactivate"} confirmDestructive size="sm">
        <p className="font-['Poppins',sans-serif] text-[14px] text-black">
          Deactivate <span className="font-semibold">{deleteUser?.firstName} {deleteUser?.lastName}</span>?
        </p>
      </Modal>
    </DashboardLayout>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div>
      <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{label}</label>
      <input type={type} min={type === "number" ? 0 : undefined} value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
    </div>
  );
}
