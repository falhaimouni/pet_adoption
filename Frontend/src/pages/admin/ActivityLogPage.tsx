import { useEffect, useState } from "react";
import { Search, Filter, ChevronRight, X } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import Badge from "../../components/Badge";
import Pagination from "../../components/Pagination";
import { useLanguage } from "../../context/LanguageContext";
import { apiFetch } from "../../lib/api";
import type { AdminDashboardDto } from "@shared/dto";

interface LogEntry {
  id: number; user: string; role: string; action: string; resource: string; resourceId: string; ip: string; timestamp: string; details: string; severity: "info" | "warning" | "critical";
}

const severityStyles: Record<LogEntry["severity"], string> = {
  info: "bg-blue-50 text-blue-600",
  warning: "bg-yellow-50 text-yellow-600",
  critical: "bg-red-50 text-red-600",
};

interface ActivityLogPageProps { onNavigate: (page: string) => void; }

export default function ActivityLogPage({ onNavigate }: ActivityLogPageProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [drawer, setDrawer] = useState<LogEntry | null>(null);
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    apiFetch<AdminDashboardDto>("/dashboard/admin")
      .then((dashboard) => {
        if (!active) return;
        setLogs(dashboard.activity.recentActivityLogs.map((item, index) => ({
          id: index + 1,
          user: item.user ? `${item.user.firstName} ${item.user.lastName}` : "System",
          role: "-",
          action: item.action,
          resource: item.entityType,
          resourceId: item.entityId ?? "-",
          ip: "-",
          timestamp: formatTimestamp(item.createdAt),
          details: `${item.action} on ${item.entityType}${item.entityId ? ` #${item.entityId}` : ""}`,
          severity: "info",
        })));
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : t("dashboard_load_error"));
        setLogs([]);
      });

    return () => {
      active = false;
    };
  }, [t]);

  const filtered = logs.filter((l) => {
    const ms = l.user.toLowerCase().includes(search.toLowerCase()) || l.action.toLowerCase().includes(search.toLowerCase()) || l.resource.toLowerCase().includes(search.toLowerCase());
    const msev = severityFilter === "all" || l.severity === severityFilter;
    const mr = roleFilter === "all" || l.role === roleFilter;
    return ms && msev && mr;
  });

  return (
    <DashboardLayout role="admin" activePage="admin-activity" onNavigate={onNavigate} pageTitle={t("admin_activity_log")} breadcrumbs={[t("role_admin"), t("admin_activity_log")]}>
      <div className="flex gap-5 relative">
        {/* Main log */}
        <div className={`flex-1 min-w-0 transition-all ${drawer ? "lg:mr-[320px]" : ""}`}>
          <div className="bg-white rounded-[15px] shadow-md p-5">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-5 items-center">
              <div className="flex-1 min-w-[200px] relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#089D97]" />
                <input placeholder={t("admin_search_activity")} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-[10px] font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
              </div>
              <div className="flex gap-2 flex-wrap">
                {["all", "info", "warning", "critical"].map((s) => (
                  <button key={s} onClick={() => setSeverityFilter(s)} className={`px-3 py-1.5 rounded-[20px] font-['Poppins',sans-serif] text-[12px] capitalize transition-colors ${severityFilter === s ? "bg-[#089D97] text-white" : "bg-gray-100 text-black/70 hover:bg-gray-200"}`}>{t(s === "all" ? "status_all" : `status_${s}`)}</button>
                ))}
              </div>
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[12px] bg-white outline-none focus:border-[#089D97]">
                <option value="all">{t("roles_all")}</option>
                {["admin", "manager", "employee", "vet", "adopter"].map((r) => <option key={r} value={r}>{t(`role_${r}`)}</option>)}
              </select>
            </div>
            {error && <p className="font-['Poppins',sans-serif] text-[13px] text-red-600 mb-4">{error}</p>}

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    {[t("th_timestamp"), t("th_user"), t("th_role"), t("th_action"), t("th_resource"), t("th_severity"), ""].map((h) => (
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
                        <Badge label={log.role} variant={log.role === "admin" ? "rejected" : log.role === "manager" ? "warning" : log.role === "vet" ? "teal" : log.role === "employee" ? "info" : "success"} />
                      </td>
                      <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black font-mono">{log.action}</td>
                      <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/60 whitespace-nowrap">{log.resource} <span className="text-black/30">#{log.resourceId}</span></td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-[6px] font-['Poppins',sans-serif] text-[11px] font-semibold capitalize ${severityStyles[log.severity]}`}>{t(`status_${log.severity}`)}</span>
                      </td>
                      <td className="py-3 px-3 text-black/30"><ChevronRight size={14} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="font-['Poppins',sans-serif] text-[12px] text-black/40">{filtered.length} entries</p>
              <Pagination page={page} totalPages={1} onPage={setPage} />
            </div>
          </div>
        </div>

        {/* Detail drawer */}
        {drawer && (
          <div className="hidden lg:block fixed right-0 top-0 w-[320px] h-full bg-white shadow-xl z-30 p-6 overflow-y-auto border-l border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <p className="font-['Poppins',sans-serif] font-semibold text-[15px] text-black">{t("activity_event_detail")}</p>
              <button onClick={() => setDrawer(null)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"><X size={14} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <span className={`inline-block px-2 py-0.5 rounded-[6px] font-['Poppins',sans-serif] text-[11px] font-semibold capitalize mb-2 ${severityStyles[drawer.severity]}`}>{t(`status_${drawer.severity}`)}</span>
                <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black font-mono">{drawer.action}</p>
              </div>
              {[
                [t("th_user"), drawer.user],
                [t("th_role"), t(`role_${drawer.role}`)],
                [t("th_resource"), `${drawer.resource} #${drawer.resourceId}`],
                [t("activity_ip_address"), drawer.ip],
                [t("th_timestamp"), drawer.timestamp],
              ].map(([k, v]) => (
                <div key={k} className="border-b border-gray-50 pb-3">
                  <p className="font-['Poppins',sans-serif] text-[11px] text-black/40 mb-0.5">{k}</p>
                  <p className="font-['Poppins',sans-serif] text-[13px] text-black font-medium">{v}</p>
                </div>
              ))}
              <div>
                <p className="font-['Poppins',sans-serif] text-[11px] text-black/40 mb-1">{t("th_details")}</p>
                <p className="font-['Poppins',sans-serif] text-[13px] text-black/70 leading-relaxed">{drawer.details}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function formatTimestamp(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().replace("T", " ").slice(0, 19);
}
