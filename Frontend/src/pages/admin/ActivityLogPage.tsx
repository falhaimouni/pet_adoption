import { useState } from "react";
import { Search, Filter, ChevronRight, X } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import Badge from "../../components/Badge";
import Pagination from "../../components/Pagination";

interface LogEntry {
  id: number; user: string; role: string; action: string; resource: string; resourceId: string; ip: string; timestamp: string; details: string; severity: "info" | "warning" | "critical";
}

const LOGS: LogEntry[] = [
  { id: 1, user: "Admin", role: "admin", action: "DELETE_USER", resource: "User", resourceId: "USR-088", ip: "192.168.1.1", timestamp: "2026-07-15 09:14:22", details: "Deleted user account for omar_test@example.com. Reason: Duplicate account.", severity: "critical" },
  { id: 2, user: "Lina Mansour", role: "manager", action: "EXPORT_REPORT", resource: "Report", resourceId: "RPT-012", ip: "192.168.1.15", timestamp: "2026-07-15 08:55:10", details: "Exported Adoption Summary PDF for date range 2026-01-01 to 2026-07-14.", severity: "info" },
  { id: 3, user: "Sara Khalil", role: "staff", action: "APPROVE_REQUEST", resource: "AdoptionRequest", resourceId: "REQ-204", ip: "192.168.1.22", timestamp: "2026-07-14 16:40:05", details: "Approved adoption request by Roaa Abushreeha for pet Mochi (DOG-011).", severity: "info" },
  { id: 4, user: "Admin", role: "admin", action: "EDIT_ROLE", resource: "Role", resourceId: "ROLE-3", ip: "192.168.1.1", timestamp: "2026-07-14 13:20:00", details: "Modified permissions for Vet role. Added: manage_vaccinations. Removed: manage_inventory.", severity: "warning" },
  { id: 5, user: "Nadia Farhat", role: "staff", action: "DELETE_PET", resource: "Pet", resourceId: "PET-072", ip: "192.168.1.30", timestamp: "2026-07-14 10:05:33", details: "Removed pet listing for Whiskers (CAT-072). Reason: Deceased.", severity: "warning" },
  { id: 6, user: "Admin", role: "admin", action: "CREATE_USER", resource: "User", resourceId: "USR-137", ip: "192.168.1.1", timestamp: "2026-07-13 14:00:11", details: "Created new staff account for nadia.farhat@petopia.com.", severity: "info" },
  { id: 7, user: "Dr. Ahmad Nasser", role: "vet", action: "ADD_MEDICAL_RECORD", resource: "MedicalRecord", resourceId: "MED-099", ip: "192.168.1.18", timestamp: "2026-07-12 11:30:00", details: "Added checkup record for pet Buddy (DOG-005). Diagnosis: Healthy.", severity: "info" },
  { id: 8, user: "Admin", role: "admin", action: "UPLOAD_FILE", resource: "File", resourceId: "FILE-041", ip: "192.168.1.1", timestamp: "2026-07-11 09:00:00", details: "Uploaded supplier_contract.pdf to Files (Contracts category).", severity: "info" },
];

const severityStyles: Record<LogEntry["severity"], string> = {
  info: "bg-blue-50 text-blue-600",
  warning: "bg-yellow-50 text-yellow-600",
  critical: "bg-red-50 text-red-600",
};

interface ActivityLogPageProps { onNavigate: (page: string) => void; }

export default function ActivityLogPage({ onNavigate }: ActivityLogPageProps) {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [drawer, setDrawer] = useState<LogEntry | null>(null);
  const [page, setPage] = useState(1);

  const filtered = LOGS.filter((l) => {
    const ms = l.user.toLowerCase().includes(search.toLowerCase()) || l.action.toLowerCase().includes(search.toLowerCase()) || l.resource.toLowerCase().includes(search.toLowerCase());
    const msev = severityFilter === "all" || l.severity === severityFilter;
    const mr = roleFilter === "all" || l.role === roleFilter;
    return ms && msev && mr;
  });

  return (
    <DashboardLayout role="admin" activePage="admin-activity" onNavigate={onNavigate} pageTitle="Activity Log" breadcrumbs={["Admin", "Activity Log"]}>
      <div className="flex gap-5 relative">
        {/* Main log */}
        <div className={`flex-1 min-w-0 transition-all ${drawer ? "lg:mr-[320px]" : ""}`}>
          <div className="bg-white rounded-[15px] shadow-md p-5">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-5 items-center">
              <div className="flex-1 min-w-[200px] relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#089D97]" />
                <input placeholder="Search user, action, resource..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-[10px] font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
              </div>
              <div className="flex gap-2 flex-wrap">
                {["all", "info", "warning", "critical"].map((s) => (
                  <button key={s} onClick={() => setSeverityFilter(s)} className={`px-3 py-1.5 rounded-[20px] font-['Poppins',sans-serif] text-[12px] capitalize transition-colors ${severityFilter === s ? "bg-[#089D97] text-white" : "bg-gray-100 text-black/70 hover:bg-gray-200"}`}>{s}</button>
                ))}
              </div>
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[12px] bg-white outline-none focus:border-[#089D97]">
                <option value="all">All roles</option>
                {["admin", "manager", "staff", "vet", "adopter"].map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Timestamp", "User", "Role", "Action", "Resource", "Severity", ""].map((h) => (
                      <th key={h} className="py-2.5 px-3 font-['Poppins',sans-serif] font-semibold text-[11px] text-black/50 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log) => (
                    <tr key={log.id} onClick={() => setDrawer(log)} className={`border-b border-gray-50 cursor-pointer hover:bg-[rgba(8,157,151,0.04)] transition-colors ${drawer?.id === log.id ? "bg-[rgba(8,157,151,0.06)]" : ""}`}>
                      <td className="py-3 px-3 font-['Poppins',sans-serif] text-[11px] text-black/50 whitespace-nowrap font-mono">{log.timestamp}</td>
                      <td className="py-3 px-3 font-['Poppins',sans-serif] font-medium text-[13px] text-black whitespace-nowrap">{log.user}</td>
                      <td className="py-3 px-3">
                        <Badge label={log.role} variant={log.role === "admin" ? "rejected" : log.role === "manager" ? "warning" : log.role === "vet" ? "teal" : log.role === "staff" ? "info" : "success"} />
                      </td>
                      <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black font-mono">{log.action}</td>
                      <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/60 whitespace-nowrap">{log.resource} <span className="text-black/30">#{log.resourceId}</span></td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-[6px] font-['Poppins',sans-serif] text-[11px] font-semibold capitalize ${severityStyles[log.severity]}`}>{log.severity}</span>
                      </td>
                      <td className="py-3 px-3 text-black/30"><ChevronRight size={14} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="font-['Poppins',sans-serif] text-[12px] text-black/40">{filtered.length} entries</p>
              <Pagination page={page} totalPages={5} onPage={setPage} />
            </div>
          </div>
        </div>

        {/* Detail drawer */}
        {drawer && (
          <div className="hidden lg:block fixed right-0 top-0 w-[320px] h-full bg-white shadow-xl z-30 p-6 overflow-y-auto border-l border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <p className="font-['Poppins',sans-serif] font-semibold text-[15px] text-black">Event Detail</p>
              <button onClick={() => setDrawer(null)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"><X size={14} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <span className={`inline-block px-2 py-0.5 rounded-[6px] font-['Poppins',sans-serif] text-[11px] font-semibold capitalize mb-2 ${severityStyles[drawer.severity]}`}>{drawer.severity}</span>
                <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black font-mono">{drawer.action}</p>
              </div>
              {[
                ["User", drawer.user],
                ["Role", drawer.role],
                ["Resource", `${drawer.resource} #${drawer.resourceId}`],
                ["IP Address", drawer.ip],
                ["Timestamp", drawer.timestamp],
              ].map(([k, v]) => (
                <div key={k} className="border-b border-gray-50 pb-3">
                  <p className="font-['Poppins',sans-serif] text-[11px] text-black/40 mb-0.5">{k}</p>
                  <p className="font-['Poppins',sans-serif] text-[13px] text-black font-medium">{v}</p>
                </div>
              ))}
              <div>
                <p className="font-['Poppins',sans-serif] text-[11px] text-black/40 mb-1">Details</p>
                <p className="font-['Poppins',sans-serif] text-[13px] text-black/70 leading-relaxed">{drawer.details}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
