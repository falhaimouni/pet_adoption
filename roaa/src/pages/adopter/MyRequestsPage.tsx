import { useState } from "react";
import { Search, Filter, Eye, X } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import DashboardLayout from "../../components/DashboardLayout";
import Badge, { statusBadge } from "../../components/Badge";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import Pagination from "../../components/Pagination";
import { ClipboardList } from "lucide-react";

interface Request {
  id: number;
  pet: string;
  species: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  note: string;
}

const REQUESTS: Request[] = [
  { id: 1, pet: "Golden Retriever", species: "Dog", submittedAt: "2026-06-10", status: "approved", note: "Great match for family." },
  { id: 2, pet: "Persian Cat", species: "Cat", submittedAt: "2026-06-15", status: "pending", note: "Awaiting review." },
  { id: 3, pet: "Rabbit (Lola)", species: "Rabbit", submittedAt: "2026-06-18", status: "rejected", note: "Shelter not accepting applications currently." },
  { id: 4, pet: "Poodle (Daisy)", species: "Dog", submittedAt: "2026-07-01", status: "pending", note: "Under review." },
  { id: 5, pet: "Chartreux", species: "Cat", submittedAt: "2026-07-05", status: "cancelled", note: "Cancelled by adopter." },
];

interface MyRequestsPageProps { onNavigate: (page: string) => void; }

export default function MyRequestsPage({ onNavigate }: MyRequestsPageProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Request | null>(null);
  const [page, setPage] = useState(1);

  const filtered = REQUESTS.filter((r) => {
    const matchSearch = r.pet.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout role="adopter" activePage="my-requests" onNavigate={onNavigate} pageTitle="My Requests" breadcrumbs={["My Petopia", "My Requests"]}>
      <div className="bg-white rounded-[15px] shadow-md p-5">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex-1 min-w-[180px] relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#089D97]" />
            <input
              placeholder={t("requests_search_ph")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-[10px] font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-[#089D97]" />
            {(["all", "pending", "approved", "rejected", "cancelled"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-[20px] font-['Poppins',sans-serif] text-[12px] transition-colors capitalize ${statusFilter === s ? "bg-[#089D97] text-white" : "bg-gray-100 text-black/70 hover:bg-gray-200"}`}
              >
                {t(`req_${s}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <EmptyState icon={<ClipboardList size={28} />} title={t("requests_no_found")} description={t("requests_no_found_desc")} action={{ label: t("requests_browse"), onClick: () => onNavigate("pets") }} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  {[t("req_pet"), t("req_species"), t("req_submitted"), t("req_status"), t("req_actions")].map((h) => (
                    <th key={h} className="py-3 px-3 font-['Poppins',sans-serif] font-semibold text-[12px] text-black/50 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-[rgba(8,157,151,0.04)] transition-colors">
                    <td className="py-3 px-3 font-['Poppins',sans-serif] font-medium text-[14px] text-black">{r.pet}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{r.species}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{r.submittedAt}</td>
                    <td className="py-3 px-3"><Badge label={r.status} variant={statusBadge(r.status)} /></td>
                    <td className="py-3 px-3">
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedRequest(r)} className="flex items-center gap-1 text-[#089D97] hover:text-[#047975] font-['Poppins',sans-serif] text-[12px] transition-colors">
                          <Eye size={14} /> {t("req_view")}
                        </button>
                        {r.status === "pending" && (
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
        <Pagination page={page} totalPages={3} onPage={setPage} />
      </div>

      {/* View modal */}
      <Modal title={t("req_details_title")} open={!!selectedRequest} onClose={() => setSelectedRequest(null)} size="sm">
        {selectedRequest && (
          <div className="space-y-3 font-['Poppins',sans-serif] text-[14px]">
            <div className="flex justify-between"><span className="text-black/60">{t("req_pet_label")}</span><span className="font-medium text-black">{selectedRequest.pet}</span></div>
            <div className="flex justify-between"><span className="text-black/60">{t("req_status_label")}</span><Badge label={selectedRequest.status} variant={statusBadge(selectedRequest.status)} /></div>
            <div className="flex justify-between"><span className="text-black/60">{t("req_submitted_label")}</span><span className="text-black">{selectedRequest.submittedAt}</span></div>
            <div className="border-t pt-3 mt-3"><p className="text-black/60 mb-1">{t("req_note_label")}</p><p className="text-black">{selectedRequest.note}</p></div>
          </div>
        )}
      </Modal>

      {/* Cancel confirm modal */}
      <Modal title={t("req_cancel_title")} open={!!cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={() => setCancelTarget(null)} confirmLabel={t("req_yes_cancel")} confirmDestructive size="sm">
        <p className="font-['Poppins',sans-serif] text-[14px] text-black">
          {t("req_cancel_confirm")} <span className="font-semibold">{cancelTarget?.pet}</span>?
        </p>
      </Modal>
    </DashboardLayout>
  );
}
