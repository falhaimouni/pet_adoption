import { useState } from "react";
import { Plus, Edit, Trash2, CheckSquare, XSquare } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import Badge from "../../components/Badge";
import Modal from "../../components/Modal";

interface RoleDef {
  id: number;
  name: string;
  label: string;
  userCount: number;
  permissions: string[];
}

const ALL_PERMISSIONS = [
  "view_pets", "manage_pets", "view_requests", "manage_requests",
  "view_adoptions", "manage_adoptions", "view_medical", "manage_medical",
  "view_vaccinations", "manage_vaccinations", "view_inventory", "manage_inventory",
  "view_users", "manage_users", "view_analytics", "manage_reports",
  "view_files", "manage_files", "view_chats", "manage_chats",
  "activity_log", "manage_suppliers",
];

const ROLES: RoleDef[] = [
  { id: 1, name: "adopter", label: "Adopter", userCount: 120, permissions: ["view_pets", "view_requests", "view_adoptions", "view_chats"] },
  { id: 2, name: "staff", label: "Staff / Employee", userCount: 8, permissions: ["view_pets", "manage_pets", "view_requests", "manage_requests", "view_adoptions", "view_chats", "manage_chats"] },
  { id: 3, name: "vet", label: "Veterinarian", userCount: 3, permissions: ["view_pets", "view_medical", "manage_medical", "view_vaccinations", "manage_vaccinations"] },
  { id: 4, name: "manager", label: "Manager", userCount: 2, permissions: ["view_pets", "manage_pets", "view_requests", "manage_requests", "view_adoptions", "manage_adoptions", "view_inventory", "manage_inventory", "view_analytics", "manage_reports"] },
  { id: 5, name: "admin", label: "Administrator", userCount: 1, permissions: ALL_PERMISSIONS },
];

const pGroup: Record<string, string[]> = {
  "Pets": ["view_pets", "manage_pets"],
  "Adoption": ["view_requests", "manage_requests", "view_adoptions", "manage_adoptions"],
  "Medical": ["view_medical", "manage_medical", "view_vaccinations", "manage_vaccinations"],
  "Inventory": ["view_inventory", "manage_inventory", "manage_suppliers"],
  "Users": ["view_users", "manage_users"],
  "Analytics": ["view_analytics", "manage_reports"],
  "Files": ["view_files", "manage_files"],
  "Chats": ["view_chats", "manage_chats"],
  "System": ["activity_log"],
};

interface AdminRolesPageProps { onNavigate: (page: string) => void; }

export default function AdminRolesPage({ onNavigate }: AdminRolesPageProps) {
  const [selected, setSelected] = useState<RoleDef>(ROLES[0]);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <DashboardLayout role="admin" activePage="admin-roles" onNavigate={onNavigate} pageTitle="Role Management" breadcrumbs={["Admin", "Roles"]}>
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Roles list */}
        <div className="w-full lg:w-[260px] shrink-0 bg-white rounded-[15px] shadow-md p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between mb-2">
            <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black">Roles</p>
            <button className="w-7 h-7 bg-[rgba(8,157,151,0.1)] text-[#089D97] rounded-[8px] flex items-center justify-center hover:bg-[rgba(8,157,151,0.2)] transition-colors">
              <Plus size={14} />
            </button>
          </div>
          {ROLES.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-[10px] text-left transition-colors ${selected.id === r.id ? "bg-[#089D97] text-white" : "hover:bg-[rgba(8,157,151,0.08)] text-black"}`}
            >
              <div>
                <p className="font-['Poppins',sans-serif] font-medium text-[13px]">{r.label}</p>
                <p className={`font-['Poppins',sans-serif] text-[11px] ${selected.id === r.id ? "text-white/70" : "text-black/50"}`}>{r.userCount} users</p>
              </div>
              <Badge label={r.name} variant={selected.id === r.id ? "neutral" : "teal"} />
            </button>
          ))}
        </div>

        {/* Permissions detail */}
        <div className="flex-1 bg-white rounded-[15px] shadow-md p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-['Poppins',sans-serif] font-semibold text-[18px] text-black">{selected.label}</h3>
              <p className="font-['Poppins',sans-serif] text-[13px] text-black/50">{selected.userCount} users · {selected.permissions.length} permissions</p>
            </div>
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-[#089D97] text-[#089D97] font-['Poppins',sans-serif] font-medium text-[13px] rounded-[10px] hover:bg-[rgba(8,157,151,0.1)] transition-colors"
            >
              <Edit size={14} /> Edit Permissions
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(pGroup).map(([group, perms]) => (
              <div key={group} className="border border-gray-100 rounded-[12px] p-4">
                <p className="font-['Poppins',sans-serif] font-semibold text-[12px] text-[#089D97] uppercase tracking-wider mb-3">{group}</p>
                <div className="flex flex-col gap-2">
                  {perms.map((p) => {
                    const has = selected.permissions.includes(p);
                    return (
                      <div key={p} className="flex items-center gap-2">
                        {has
                          ? <CheckSquare size={14} className="text-[#089D97] shrink-0" />
                          : <XSquare size={14} className="text-gray-300 shrink-0" />}
                        <span className={`font-['Poppins',sans-serif] text-[12px] ${has ? "text-black" : "text-black/30"}`}>
                          {p.replace(/_/g, " ")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal title={`Edit: ${selected.label}`} open={editOpen} onClose={() => setEditOpen(false)} onConfirm={() => setEditOpen(false)} confirmLabel="Save Permissions" size="lg">
        <p className="font-['Poppins',sans-serif] text-[13px] text-black/50 mb-4">Toggle permissions for the <span className="font-semibold text-black">{selected.label}</span> role.</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 max-h-[340px] overflow-y-auto pr-2">
          {ALL_PERMISSIONS.map((p) => (
            <label key={p} className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" defaultChecked={selected.permissions.includes(p)} className="w-4 h-4 accent-[#089D97]" />
              <span className="font-['Poppins',sans-serif] text-[13px] text-black group-hover:text-[#089D97] transition-colors">
                {p.replace(/_/g, " ")}
              </span>
            </label>
          ))}
        </div>
      </Modal>
    </DashboardLayout>
  );
}
