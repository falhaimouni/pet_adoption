import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import Badge, { statusBadge } from "../../components/Badge";
import Modal from "../../components/Modal";

interface Vaccine {
  id: number; name: string; date: string; nextDue: string; batch: string; status: "given" | "due" | "overdue";
}

const VACCINES: Vaccine[] = [
  { id: 1, name: "Rabies", date: "2025-09-15", nextDue: "2026-09-15", batch: "RB2024-01", status: "given" },
  { id: 2, name: "Distemper (DHPP)", date: "2026-01-10", nextDue: "2027-01-10", batch: "DH2026-03", status: "given" },
  { id: 3, name: "Bordetella", date: "2025-12-01", nextDue: "2026-09-15", batch: "BO2025-11", status: "due" },
  { id: 4, name: "Leptospirosis", date: "2025-06-20", nextDue: "2026-06-20", batch: "LP2025-06", status: "overdue" },
];

interface VetVaccinationsPageProps { onNavigate: (page: string) => void; params?: { petId?: number }; }

export default function VetVaccinationsPage({ onNavigate }: VetVaccinationsPageProps) {
  const [vaccines, setVaccines] = useState(VACCINES);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Vaccine | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vaccine | null>(null);
  const [form, setForm] = useState({ name: "", date: "", nextDue: "", batch: "" });

  const saveVaccine = () => {
    if (editTarget) {
      setVaccines((p) => p.map((vaccine) => vaccine.id === editTarget.id ? { ...vaccine, ...form } : vaccine));
      setEditTarget(null);
    } else {
      setVaccines((p) => [...p, { id: Date.now(), ...form, status: "given" as const }]);
    }
    setForm({ name: "", date: "", nextDue: "", batch: "" });
    setAddOpen(false);
  };

  const openEdit = (vaccine: Vaccine) => {
    setEditTarget(vaccine);
    setForm({ name: vaccine.name, date: vaccine.date, nextDue: vaccine.nextDue, batch: vaccine.batch });
    setAddOpen(true);
  };

  return (
    <DashboardLayout role="vet" activePage="vet-vaccinations" onNavigate={onNavigate} pageTitle="Vaccinations — Max" breadcrumbs={["Vet", "Pets", "Max", "Vaccinations"]}>
      <div className="max-w-3xl">
        <div className="bg-white rounded-[15px] shadow-md p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black">Vaccination Records</h3>
            <button onClick={() => { setEditTarget(null); setForm({ name: "", date: "", nextDue: "", batch: "" }); setAddOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-[#089D97] text-white rounded-[10px] font-['Poppins',sans-serif] font-medium text-[13px] hover:bg-[#047975] transition-colors">
              <Plus size={15} /> Add Vaccine
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Vaccine", "Date Given", "Next Due", "Batch #", "Status", "Actions"].map((h) => (
                    <th key={h} className="py-2.5 px-3 font-['Poppins',sans-serif] font-semibold text-[11px] text-black/50 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vaccines.map((v) => (
                  <tr key={v.id} className="border-b border-gray-50 hover:bg-[rgba(8,157,151,0.03)] transition-colors">
                    <td className="py-3 px-3 font-['Poppins',sans-serif] font-medium text-[14px] text-black">{v.name}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{v.date}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{v.nextDue}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/50">{v.batch}</td>
                    <td className="py-3 px-3">
                      <Badge label={v.status} variant={v.status === "given" ? "success" : v.status === "due" ? "pending" : "rejected"} />
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(v)} className="text-blue-400 hover:text-blue-600 transition-colors"><Edit size={15} /></button>
                        <button onClick={() => setDeleteTarget(v)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal title={editTarget ? "Edit Vaccination" : "Add Vaccination"} open={addOpen} onClose={() => { setAddOpen(false); setEditTarget(null); }} onConfirm={saveVaccine} confirmLabel={editTarget ? "Save Changes" : "Add"} size="md">
        <div className="grid grid-cols-2 gap-4">
          {[{ label: "Vaccine Name", field: "name" as const, placeholder: "e.g. Rabies" }, { label: "Batch #", field: "batch" as const, placeholder: "e.g. RB2026-01" }].map(({ label, field, placeholder }) => (
            <div key={field}>
              <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{label}</label>
              <input value={form[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} placeholder={placeholder} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
            </div>
          ))}
          {[{ label: "Date Given", field: "date" as const }, { label: "Next Due", field: "nextDue" as const }].map(({ label, field }) => (
            <div key={field}>
              <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{label}</label>
              <input type="date" value={form[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
            </div>
          ))}
        </div>
      </Modal>

      <Modal title="Delete Vaccine" open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => { setVaccines((p) => p.filter((v) => v.id !== deleteTarget?.id)); setDeleteTarget(null); }} confirmLabel="Delete" confirmDestructive size="sm">
        <p className="font-['Poppins',sans-serif] text-[14px] text-black">Delete the <span className="font-semibold">{deleteTarget?.name}</span> vaccination record?</p>
      </Modal>
    </DashboardLayout>
  );
}
