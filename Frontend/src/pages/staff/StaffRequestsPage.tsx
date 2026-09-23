import { useEffect, useMemo, useState } from "react";
import { CheckCircle, ClipboardList, Eye, Search, XCircle } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import Badge, { statusBadge } from "../../components/Badge";
import EmptyState from "../../components/EmptyState";
import Modal from "../../components/Modal";
import { apiFetch } from "../../lib/api";
import type { UserRole } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

interface AdoptionRequest {
  requestId: string;
  status: string;
  notes?: string | null;
  requestDate: string;
  adopter: { firstName: string; lastName: string };
  pet: { name: string; species: string; adoptionStatus: string };
}

interface StaffRequestsPageProps { onNavigate: (page: string) => void; role?: UserRole; activePage?: string; }

export default function StaffRequestsPage({ onNavigate, role = "employee", activePage = "staff-requests" }: StaffRequestsPageProps) {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<AdoptionRequest[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewReq, setViewReq] = useState<AdoptionRequest | null>(null);
  const [actionTarget, setActionTarget] = useState<{ req: AdoptionRequest; action: "approve" | "reject" } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    let active = true;
    const refresh = () => apiFetch<AdoptionRequest[]>("/adoption/requests")
      .then((data) => { if (active) { setRequests(data); setError(""); } })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : t("requests_load_error")); })
      .finally(() => { if (active) setLoading(false); });
    void refresh();
    window.addEventListener("petopia:notifications-changed", refresh);
    return () => {
      active = false;
      window.removeEventListener("petopia:notifications-changed", refresh);
    };
  }, [t]);

  const filtered = useMemo(() => requests.filter((r) => {
    const adopter = `${r.adopter.firstName} ${r.adopter.lastName}`.toLowerCase();
    const matchSearch = adopter.includes(search.toLowerCase()) || r.pet.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status.toLowerCase() === statusFilter;
    return matchSearch && matchStatus;
  }), [requests, search, statusFilter]);

  async function confirmAction() {
    if (!actionTarget) return;
    const updated = await apiFetch<AdoptionRequest>(`/adoption/requests/${actionTarget.req.requestId}/${actionTarget.action}`, { method: "POST" });
    setRequests((prev) => prev.map((r) => r.requestId === updated.requestId ? updated : r));
    setActionTarget(null);
  }

  return (
    <DashboardLayout role={role} activePage={activePage} onNavigate={onNavigate} pageTitle={t("staff_requests_title")} breadcrumbs={[t(`role_${role}`), t("staff_requests_title")]}>
      <div className="bg-white rounded-[15px] shadow-md p-5">
        <div className="flex flex-wrap gap-3 mb-5 items-center">
          <div className="flex-1 min-w-[180px] relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#089D97]" />
            <input placeholder={t("staff_search_adopter")} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-[10px] font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", "pending", "approved", "rejected", "cancelled"].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-[20px] font-['Poppins',sans-serif] text-[12px] capitalize transition-colors ${statusFilter === s ? "bg-[#089D97] text-white" : "bg-gray-100 text-black/70 hover:bg-gray-200"}`}>{t(s === "all" ? "status_all" : `req_${s}`)}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((n) => <div key={n} className="h-[58px] rounded-[10px] bg-gray-50 animate-pulse" />)}</div>
        ) : error ? (
          <EmptyState icon={<ClipboardList size={28} />} title={t("requests_load_error")} description={error} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<ClipboardList size={28} />} title={t("requests_no_found")} description={t("requests_no_match_desc")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  {[t("th_adopter"), t("th_pet"), t("th_species"), t("th_submitted"), t("th_status"), t("th_actions")].map((h) => <th key={h} className="py-2.5 px-3 font-['Poppins',sans-serif] font-semibold text-[11px] text-black/50 uppercase tracking-wider whitespace-nowrap">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.requestId} className="border-b border-gray-50 hover:bg-[rgba(8,157,151,0.03)] transition-colors">
                    <td className="py-3 px-3 font-['Poppins',sans-serif] font-medium text-[13px] text-black">{r.adopter.firstName} {r.adopter.lastName}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{r.pet.name}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{r.pet.species}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/60">{r.requestDate}</td>
                    <td className="py-3 px-3"><Badge label={r.status.toLowerCase()} variant={statusBadge(r.status.toLowerCase())} /></td>
                    <td className="py-3 px-3">
                      <div className="flex gap-2 items-center">
                        <button onClick={() => setViewReq(r)} className="text-[#089D97] hover:text-[#047975] transition-colors" aria-label={t("aria_view_request")}><Eye size={15} /></button>
                        {r.status.toUpperCase() === "PENDING" && (
                          <>
                            <button onClick={() => setActionTarget({ req: r, action: "approve" })} className="text-green-500 hover:text-green-700 transition-colors" aria-label={t("aria_approve_request")}><CheckCircle size={15} /></button>
                            <button onClick={() => setActionTarget({ req: r, action: "reject" })} className="text-red-400 hover:text-red-600 transition-colors" aria-label={t("aria_reject_request")}><XCircle size={15} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal title={t("req_details_title")} open={!!viewReq} onClose={() => setViewReq(null)} size="md">
        {viewReq && (
          <div className="space-y-3 font-['Poppins',sans-serif] text-[14px]">
            <div className="flex justify-between"><span className="text-black/60">{t("th_adopter")}</span><span className="font-medium text-black">{viewReq.adopter.firstName} {viewReq.adopter.lastName}</span></div>
            <div className="flex justify-between"><span className="text-black/60">{t("req_pet_label")}</span><span className="font-medium text-black">{viewReq.pet.name}</span></div>
            <div><p className="text-black/60 mb-1">{t("th_notes")}</p><p className="text-black">{viewReq.notes || "-"}</p></div>
          </div>
        )}
      </Modal>

      <Modal title={actionTarget?.action === "approve" ? t("staff_req_approve_title") : t("staff_req_reject_title")} open={!!actionTarget} onClose={() => setActionTarget(null)} onConfirm={confirmAction} confirmLabel={actionTarget?.action === "approve" ? t("action_approve") : t("action_reject")} confirmDestructive={actionTarget?.action === "reject"} size="sm">
        <p className="font-['Poppins',sans-serif] text-[14px] text-black">{t("staff_req_action_confirm").replace("{pet}", actionTarget?.req.pet.name ?? "")}</p>
      </Modal>
    </DashboardLayout>
  );
}
