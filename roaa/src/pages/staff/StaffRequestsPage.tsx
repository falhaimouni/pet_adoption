import { useState } from "react";
import { Search, CheckCircle, XCircle, Eye } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import Badge, { statusBadge } from "../../components/Badge";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";

interface Request {
  id: number; adopter: string; pet: string; species: string; submitted: string; status: string; note: string; email: string;
}

const REQUESTS: Request[] = [
  { id: 1, adopter: "Roaa A.", pet: "Golden Retriever", species: "Dog", submitted: "2026-07-10", status: "pending", note: "Family with backyard, previous dog owner.", email: "roaa@example.com" },
  { id: 2, adopter: "Ali M.", pet: "Persian Cat", species: "Cat", submitted: "2026-07-09", status: "approved", note: "Single adult, apartment.", email: "ali@example.com" },
  { id: 3, adopter: "Sara K.", pet: "Rabbit (Lola)", species: "Rabbit", submitted: "2026-07-08", status: "rejected", note: "Does not meet housing requirements.", email: "sara@example.com" },
  { id: 4, adopter: "Lara B.", pet: "Poodle", species: "Dog", submitted: "2026-07-07", status: "pending", note: "Couple, house with garden.", email: "lara@example.com" },
  { id: 5, adopter: "Omar H.", pet: "Chartreux", species: "Cat", submitted: "2026-07-06", status: "pending", note: "Works from home, quiet environment.", email: "omar@example.com" },
];

interface StaffRequestsPageProps { onNavigate: (page: string) => void; }

export default function StaffRequestsPage({ onNavigate }: StaffRequestsPageProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewReq, setViewReq] = useState<Request | null>(null);
  const [actionTarget, setActionTarget] = useState<{ req: Request; action: "approve" | "reject" } | null>(null);
  const [page, setPage] = useState(1);

  const filtered = REQUESTS.filter((r) => {
    const ms = r.adopter.toLowerCase().includes(search.toLowerCase()) || r.pet.toLowerCase().includes(search.toLowerCase());
    const mf = statusFilter === "all" || r.status === statusFilter;
    return ms && mf;
  });

  return (
    <DashboardLayout role="staff" activePage="staff-requests" onNavigate={onNavigate} pageTitle="Adoption Requests" breadcrumbs={["Staff", "Adoption Requests"]}>
      <div className="bg-white rounded-[15px] shadow-md p-5">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 mb-5 items-center">
          <div className="flex-1 min-w-[180px] relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#089D97]" />
            <input placeholder="Search adopter or pet..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-[10px] font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", "pending", "approved", "rejected"].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-[20px] font-['Poppins',sans-serif] text-[12px] capitalize transition-colors ${statusFilter === s ? "bg-[#089D97] text-white" : "bg-gray-100 text-black/70 hover:bg-gray-200"}`}>{s}</button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                {["Adopter", "Pet", "Species", "Submitted", "Status", "Actions"].map((h) => (
                  <th key={h} className="py-2.5 px-3 font-['Poppins',sans-serif] font-semibold text-[11px] text-black/50 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-[rgba(8,157,151,0.03)] transition-colors">
                  <td className="py-3 px-3 font-['Poppins',sans-serif] font-medium text-[13px] text-black">{r.adopter}</td>
                  <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{r.pet}</td>
                  <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{r.species}</td>
                  <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/60">{r.submitted}</td>
                  <td className="py-3 px-3"><Badge label={r.status} variant={statusBadge(r.status)} /></td>
                  <td className="py-3 px-3">
                    <div className="flex gap-2 items-center">
                      <button onClick={() => setViewReq(r)} className="text-[#089D97] hover:text-[#047975] transition-colors"><Eye size={15} /></button>
                      {r.status === "pending" && (
                        <>
                          <button onClick={() => setActionTarget({ req: r, action: "approve" })} className="text-green-500 hover:text-green-700 transition-colors"><CheckCircle size={15} /></button>
                          <button onClick={() => setActionTarget({ req: r, action: "reject" })} className="text-red-400 hover:text-red-600 transition-colors"><XCircle size={15} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={3} onPage={setPage} />
      </div>

      {/* View modal */}
      <Modal title="Request Details" open={!!viewReq} onClose={() => setViewReq(null)} size="md">
        {viewReq && (
          <div className="space-y-3 font-['Poppins',sans-serif] text-[14px]">
            {[["Adopter", viewReq.adopter], ["Email", viewReq.email], ["Pet", viewReq.pet], ["Species", viewReq.species], ["Submitted", viewReq.submitted]].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-black/60">{k}</span>
                <span className="font-medium text-black">{v}</span>
              </div>
            ))}
            <div><p className="text-black/60 mb-1">Notes</p><p className="text-black">{viewReq.note}</p></div>
            <div><p className="text-black/60 mb-1">Status</p><Badge label={viewReq.status} variant={statusBadge(viewReq.status)} /></div>
            {viewReq.status === "pending" && (
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setViewReq(null); setActionTarget({ req: viewReq, action: "approve" }); }} className="flex-1 py-2 bg-green-500 text-white rounded-[10px] font-medium hover:bg-green-600 transition-colors">Approve</button>
                <button onClick={() => { setViewReq(null); setActionTarget({ req: viewReq, action: "reject" }); }} className="flex-1 py-2 bg-red-500 text-white rounded-[10px] font-medium hover:bg-red-600 transition-colors">Reject</button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Action confirm */}
      <Modal title={actionTarget?.action === "approve" ? "Approve Request" : "Reject Request"} open={!!actionTarget} onClose={() => setActionTarget(null)} onConfirm={() => setActionTarget(null)} confirmLabel={actionTarget?.action === "approve" ? "Approve" : "Reject"} confirmDestructive={actionTarget?.action === "reject"} size="sm">
        <p className="font-['Poppins',sans-serif] text-[14px] text-black">
          Are you sure you want to <span className="font-semibold">{actionTarget?.action}</span> the request from <span className="font-semibold">{actionTarget?.req.adopter}</span> for <span className="font-semibold">{actionTarget?.req.pet}</span>?
        </p>
      </Modal>
    </DashboardLayout>
  );
}
