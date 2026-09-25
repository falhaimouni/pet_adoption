import { useText } from "../../i18n/useText";
import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Eye, Filter, Search, X } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import DashboardLayout from "../../components/DashboardLayout";
import Badge, { statusBadge } from "../../components/Badge";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import { apiFetch } from "../../lib/api";

interface AdoptionRequest {
  requestId: string;
  status: string;
  notes?: string | null;
  requestDate: string;
  pet: { petId: string; name: string; species: string; adoptionStatus: string };
}

interface MyRequestsPageProps { onNavigate: (page: string) => void; }

export default function MyRequestsPage({ onNavigate }: MyRequestsPageProps) {
  const tx = useText();
  const { t } = useLanguage();
  const [requests, setRequests] = useState<AdoptionRequest[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<AdoptionRequest | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AdoptionRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    apiFetch<AdoptionRequest[]>("/adoption/requests")
      .then(setRequests)
      .catch((err) => setError(err instanceof Error ? err.message : tx("Unable to load adoption requests.")))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => requests.filter((r) => {
    const matchSearch = r.pet.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status.toLowerCase() === statusFilter;
    return matchSearch && matchStatus;
  }), [requests, search, statusFilter]);

  async function cancelRequest() {
    if (!cancelTarget) return;
    const updated = await apiFetch<AdoptionRequest>(`/adoption/requests/${cancelTarget.requestId}/cancel`, { method: "PATCH" });
    setRequests((prev) => prev.map((r) => r.requestId === updated.requestId ? updated : r));
    setCancelTarget(null);
  }

  return (
    <DashboardLayout role="adopter" activePage="my-requests" onNavigate={onNavigate} pageTitle={tx("My Requests")} breadcrumbs={["My Petopia", "My Requests"]}>
      <div className="bg-white rounded-[15px] shadow-md p-5">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex-1 min-w-[180px] relative">
            <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-[#089D97]" />
            <input placeholder={t("requests_search_ph")} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full ps-8 pe-3 py-2 border border-gray-200 rounded-[10px] font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={15} className="text-[#089D97]" />
            {(["all", "pending", "approved", "rejected", "cancelled"] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-[20px] font-['Poppins',sans-serif] text-[12px] transition-colors capitalize ${statusFilter === s ? "bg-[#089D97] text-white" : "bg-gray-100 text-black/70 hover:bg-gray-200"}`}>
                {t(`req_${s}`)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((n) => <div key={n} className="h-[58px] rounded-[10px] bg-gray-50 animate-pulse" />)}</div>
        ) : error ? (
          <EmptyState icon={<ClipboardList size={28} />} title={t("requests_load_error")} description={error} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<ClipboardList size={28} />} title={t("requests_no_found")} description={t("requests_no_found_desc")} action={{ label: t("requests_browse"), onClick: () => onNavigate("pets") }} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead>
                <tr className="border-b border-gray-100">
                  {[t("req_pet"), t("req_species"), t("req_submitted"), t("req_status"), t("req_actions")].map((h) => (
                    <th key={h} className="py-3 px-3 font-['Poppins',sans-serif] font-semibold text-[12px] text-black/50 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.requestId} className="border-b border-gray-50 hover:bg-[rgba(8,157,151,0.04)] transition-colors">
                    <td className="py-3 px-3 font-['Poppins',sans-serif] font-medium text-[14px] text-black">{r.pet.name}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{tx(r.pet.species)}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{r.requestDate}</td>
                    <td className="py-3 px-3"><Badge label={r.status.toLowerCase()} variant={statusBadge(r.status.toLowerCase())} /></td>
                    <td className="py-3 px-3">
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedRequest(r)} className="flex items-center gap-1 text-[#089D97] hover:text-[#047975] font-['Poppins',sans-serif] text-[12px] transition-colors">
                          <Eye size={14} /> {t("req_view")}
                        </button>
                        {r.status.toUpperCase() === "PENDING" && (
                          <button onClick={() => setCancelTarget(r)} className="flex items-center gap-1 text-red-500 hover:text-red-700 font-['Poppins',sans-serif] text-[12px] transition-colors">
                            <X size={14} /> {t("req_cancel")}
                          </button>
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

      <Modal title={t("req_details_title")} open={!!selectedRequest} onClose={() => setSelectedRequest(null)} size="sm">
        {selectedRequest && (
          <div className="space-y-3 font-['Poppins',sans-serif] text-[14px]">
            <div className="flex justify-between"><span className="text-black/60">{t("req_pet_label")}</span><span className="font-medium text-black">{selectedRequest.pet.name}</span></div>
            <div className="flex justify-between"><span className="text-black/60">{t("req_status_label")}</span><Badge label={selectedRequest.status.toLowerCase()} variant={statusBadge(selectedRequest.status.toLowerCase())} /></div>
            <div className="flex justify-between"><span className="text-black/60">{t("req_submitted_label")}</span><span className="text-black">{selectedRequest.requestDate}</span></div>
            <div className="border-t pt-3 mt-3"><p className="text-black/60 mb-1">{t("req_note_label")}</p><p className="text-black">{selectedRequest.notes || "-"}</p></div>
          </div>
        )}
      </Modal>

      <Modal title={t("req_cancel_title")} open={!!cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={cancelRequest} confirmLabel={t("req_yes_cancel")} confirmDestructive size="sm">
        <p className="font-['Poppins',sans-serif] text-[14px] text-black">
          {t("req_cancel_confirm")} <span className="font-semibold">{cancelTarget?.pet.name}</span>?
        </p>
      </Modal>
    </DashboardLayout>
  );
}
