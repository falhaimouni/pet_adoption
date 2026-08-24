import { useState } from "react";
import { Search, Eye, CheckCircle, Clock, X, Calendar } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import Badge, { statusBadge } from "../../components/Badge";
import Pagination from "../../components/Pagination";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";

interface Appointment {
  id: number; pet: string; owner: string; species: string;
  date: string; time: string; reason: string; status: "pending" | "completed" | "cancelled" | "rescheduled";
}

const APPOINTMENTS: Appointment[] = [
  { id: 1001, pet: "Max", owner: "Roaa A.", species: "Dog", date: "2026-08-06", time: "02:00 PM", reason: "Annual Checkup", status: "pending" },
  { id: 1002, pet: "Cleo", owner: "Hana J.", species: "Cat", date: "2026-08-06", time: "03:30 PM", reason: "Vaccination", status: "pending" },
  { id: 1003, pet: "Bunny", owner: "Rami S.", species: "Rabbit", date: "2026-08-07", time: "10:00 AM", reason: "Dental Cleaning", status: "pending" },
  { id: 1004, pet: "Rocky", owner: "Ali M.", species: "Dog", date: "2026-08-07", time: "11:30 AM", reason: "Injury Follow-up", status: "pending" },
  { id: 1005, pet: "Luna", owner: "Sara K.", species: "Cat", date: "2026-08-05", time: "09:00 AM", reason: "Spay Pre-op", status: "completed" },
  { id: 1006, pet: "Shadow", owner: "Omar H.", species: "Cat", date: "2026-08-04", time: "01:00 PM", reason: "Ear Infection", status: "completed" },
  { id: 1007, pet: "Lola", owner: "Nadia B.", species: "Rabbit", date: "2026-08-03", time: "04:00 PM", reason: "Weight Check", status: "completed" },
  { id: 1008, pet: "Buddy", owner: "Khaled W.", species: "Dog", date: "2026-08-02", time: "10:30 AM", reason: "Bordetella Vaccine", status: "cancelled" },
];

const FILTER_TABS = ["all", "today", "upcoming", "completed", "cancelled"] as const;
type FilterTab = typeof FILTER_TABS[number];

const TODAY = "2026-08-06";

interface VetAppointmentsPageProps { onNavigate: (page: string, params?: Record<string, unknown>) => void; }

export default function VetAppointmentsPage({ onNavigate }: VetAppointmentsPageProps) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<FilterTab>("all");
  const [page, setPage] = useState(1);
  const [appointments, setAppointments] = useState(APPOINTMENTS);
  const [confirmTarget, setConfirmTarget] = useState<{ id: number; action: "complete" | "cancel" } | null>(null);

  const filtered = appointments.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.pet.toLowerCase().includes(q) || a.owner.toLowerCase().includes(q) || a.reason.toLowerCase().includes(q);
    const matchTab =
      tab === "all" ? true :
      tab === "today" ? a.date === TODAY :
      tab === "upcoming" ? a.date > TODAY && a.status === "pending" :
      tab === "completed" ? a.status === "completed" :
      tab === "cancelled" ? a.status === "cancelled" : true;
    return matchSearch && matchTab;
  });

  const PER_PAGE = 6;
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function handleAction() {
    if (!confirmTarget) return;
    setAppointments((prev) =>
      prev.map((a) => a.id === confirmTarget.id ? { ...a, status: confirmTarget.action === "complete" ? "completed" : "cancelled" } : a)
    );
    setConfirmTarget(null);
  }

  const tabCounts: Record<FilterTab, number> = {
    all: appointments.length,
    today: appointments.filter((a) => a.date === TODAY).length,
    upcoming: appointments.filter((a) => a.date > TODAY && a.status === "pending").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  };

  return (
    <DashboardLayout role="vet" activePage="vet-appointments" onNavigate={onNavigate} pageTitle="Appointments" breadcrumbs={["Vet", "Appointments"]}>
      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-4">
        {FILTER_TABS.map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-[20px] font-['Poppins',sans-serif] text-[13px] font-medium capitalize transition-all ${tab === t ? "bg-[#089D97] text-white shadow-md" : "bg-white text-[#1a2e2d] hover:bg-[rgba(8,157,151,0.08)]"}`}
          >
            {t}
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${tab === t ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500"}`}>{tabCounts[t]}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[15px] shadow-md p-5">
        {/* Search */}
        <div className="relative mb-5 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#089D97]" />
          <input
            placeholder="Search pet, owner, reason…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-[10px] font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors"
          />
        </div>

        {paginated.length === 0 ? (
          <EmptyState icon={<Calendar size={28} />} title="No appointments found" description="Try adjusting your search or filter." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  {["ID", "Pet", "Owner", "Reason", "Date", "Time", "Status", "Actions"].map((h) => (
                    <th key={h} className="py-2.5 px-3 font-['Poppins',sans-serif] font-semibold text-[11px] text-black/50 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-[rgba(8,157,151,0.03)] transition-colors">
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/40">#{a.id}</td>
                    <td className="py-3 px-3">
                      <p className="font-['Poppins',sans-serif] font-medium text-[14px] text-black">{a.pet}</p>
                      <p className="font-['Poppins',sans-serif] text-[11px] text-black/40">{a.species}</p>
                    </td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{a.owner}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70 max-w-[160px] truncate">{a.reason}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/60 whitespace-nowrap">{a.date}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-[#089D97] font-medium whitespace-nowrap">{a.time}</td>
                    <td className="py-3 px-3"><Badge label={a.status} variant={statusBadge(a.status)} /></td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onNavigate("vet-appointment-detail", { appointmentId: a.id })}
                          title="View" className="text-[#089D97] hover:text-[#047975] transition-colors"
                        ><Eye size={15} /></button>
                        {a.status === "pending" && (
                          <>
                            <button title="Complete" onClick={() => setConfirmTarget({ id: a.id, action: "complete" })} className="text-green-500 hover:text-green-700 transition-colors"><CheckCircle size={15} /></button>
                            <button title="Cancel" onClick={() => setConfirmTarget({ id: a.id, action: "cancel" })} className="text-red-400 hover:text-red-600 transition-colors"><X size={15} /></button>
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

        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPage={setPage} />}
      </div>

      {/* Confirm modal */}
      <Modal
        title={confirmTarget?.action === "complete" ? "Complete Appointment" : "Cancel Appointment"}
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleAction}
        confirmLabel={confirmTarget?.action === "complete" ? "Mark Completed" : "Cancel Appointment"}
        confirmDestructive={confirmTarget?.action === "cancel"}
        size="sm"
      >
        <p className="font-['Poppins',sans-serif] text-[14px] text-black">
          {confirmTarget?.action === "complete"
            ? "Mark this appointment as completed?"
            : "Are you sure you want to cancel this appointment? This cannot be undone."}
        </p>
      </Modal>
    </DashboardLayout>
  );
}
