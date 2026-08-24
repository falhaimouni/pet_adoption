import { useState } from "react";
import { Search, Edit, Trash2, Plus, Shield, Eye } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import Badge, { statusBadge } from "../../components/Badge";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import profileImg from "../../imports/MyPetopia/0ade9078bed97f834442fbb8c3bc4424aaf43269.png";

interface User {
  id: number; name: string; email: string; role: string; status: string; joined: string; lastActive: string;
}

const USERS: User[] = [
  { id: 1, name: "Roaa Abushreeha", email: "roaa@example.com", role: "adopter", status: "active", joined: "2025-09-01", lastActive: "2026-07-14" },
  { id: 2, name: "Sara Khalil", email: "sara@petopia.com", role: "staff", status: "active", joined: "2024-03-15", lastActive: "2026-07-15" },
  { id: 3, name: "Dr. Ahmad Nasser", email: "ahmad@petopia.com", role: "vet", status: "active", joined: "2024-06-01", lastActive: "2026-07-12" },
  { id: 4, name: "Lina Mansour", email: "lina@petopia.com", role: "manager", status: "active", joined: "2023-11-01", lastActive: "2026-07-15" },
  { id: 5, name: "Omar Haddad", email: "omar@example.com", role: "adopter", status: "active", joined: "2026-01-10", lastActive: "2026-07-10" },
  { id: 6, name: "Hana Jamil", email: "hana@example.com", role: "adopter", status: "active", joined: "2026-02-20", lastActive: "2026-07-08" },
  { id: 7, name: "Rami Saleh", email: "rami@example.com", role: "adopter", status: "active", joined: "2025-05-11", lastActive: "2026-06-30" },
  { id: 8, name: "Nadia Farhat", email: "nadia@petopia.com", role: "staff", status: "active", joined: "2024-08-22", lastActive: "2026-07-13" },
];

const ROLES = ["all", "adopter", "staff", "vet", "manager", "admin"];

interface AdminUsersPageProps { onNavigate: (page: string) => void; }

export default function AdminUsersPage({ onNavigate }: AdminUsersPageProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);

  const filtered = USERS.filter((u) => {
    const ms = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const mr = roleFilter === "all" || u.role === roleFilter;
    return ms && mr;
  });

  return (
    <DashboardLayout role="admin" activePage="admin-users" onNavigate={onNavigate} pageTitle="User Management" breadcrumbs={["Admin", "Users"]}>
      <div className="bg-white rounded-[15px] shadow-md p-5">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 mb-5 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#089D97]" />
            <input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-[10px] font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-[20px] font-['Poppins',sans-serif] text-[12px] capitalize transition-colors ${roleFilter === r ? "bg-[#089D97] text-white" : "bg-gray-100 text-black/70 hover:bg-gray-200"}`}
              >
                {r}
              </button>
            ))}
          </div>
          <button
            onClick={() => onNavigate("admin-roles")}
            className="flex items-center gap-2 px-4 py-2 border border-[#089D97] text-[#089D97] font-['Poppins',sans-serif] font-medium text-[13px] rounded-[10px] hover:bg-[rgba(8,157,151,0.1)] transition-colors"
          >
            <Shield size={15} /> Manage Roles
          </button>
        </div>

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
                <tr key={u.id} className="border-b border-gray-50 hover:bg-[rgba(8,157,151,0.03)] transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[rgba(8,157,151,0.15)] overflow-hidden shrink-0 flex items-center justify-center">
                        <img src={profileImg} alt="" className="w-full h-full object-contain" />
                      </div>
                      <span className="font-['Poppins',sans-serif] font-medium text-[13px] text-black whitespace-nowrap">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/60">{u.email}</td>
                  <td className="py-3 px-3"><Badge label={u.role} variant={statusBadge(u.role)} /></td>
                  <td className="py-3 px-3"><Badge label={u.status} variant={statusBadge(u.status)} /></td>
                  <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/60">{u.joined}</td>
                  <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/60">{u.lastActive}</td>
                  <td className="py-3 px-3">
                    <div className="flex gap-2">
                      <button onClick={() => setViewUser(u)} className="text-[#089D97] hover:text-[#047975] transition-colors"><Eye size={15} /></button>
                      <button onClick={() => setEditUser(u)} className="text-blue-400 hover:text-blue-600 transition-colors"><Edit size={15} /></button>
                      <button onClick={() => setDeleteUser(u)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-3">
          <p className="font-['Poppins',sans-serif] text-[12px] text-black/40">{filtered.length} users found</p>
          <Pagination page={page} totalPages={4} onPage={setPage} />
        </div>
      </div>

      {/* View modal */}
      <Modal title="User Details" open={!!viewUser} onClose={() => setViewUser(null)} size="sm">
        {viewUser && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-12 h-12 rounded-full bg-[rgba(8,157,151,0.15)] overflow-hidden">
                <img src={profileImg} alt="" className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black">{viewUser.name}</p>
                <Badge label={viewUser.role} variant={statusBadge(viewUser.role)} />
              </div>
            </div>
            {[["Email", viewUser.email], ["Status", viewUser.status], ["Joined", viewUser.joined], ["Last Active", viewUser.lastActive]].map(([k, v]) => (
              <div key={k} className="flex justify-between text-[13px] font-['Poppins',sans-serif] border-b border-gray-50 pb-2">
                <span className="text-black/50">{k}</span>
                <span className="font-medium text-black">{v}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Edit role modal */}
      <Modal title="Edit User" open={!!editUser} onClose={() => setEditUser(null)} onConfirm={() => setEditUser(null)} confirmLabel="Save Changes" size="sm">
        {editUser && (
          <div className="space-y-4">
            <div>
              <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">Role</label>
              <select defaultValue={editUser.role} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] bg-white outline-none focus:border-[#089D97] transition-colors">
                {["adopter", "staff", "vet", "manager", "admin"].map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">Status</label>
              <select defaultValue={editUser.status} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] bg-white outline-none focus:border-[#089D97] transition-colors">
                <option>active</option><option>inactive</option><option>suspended</option>
              </select>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal title="Delete User" open={!!deleteUser} onClose={() => setDeleteUser(null)} onConfirm={() => setDeleteUser(null)} confirmLabel="Delete" confirmDestructive size="sm">
        <p className="font-['Poppins',sans-serif] text-[14px] text-black">
          Permanently delete <span className="font-semibold">{deleteUser?.name}</span>? This action cannot be undone.
        </p>
      </Modal>
    </DashboardLayout>
  );
}
