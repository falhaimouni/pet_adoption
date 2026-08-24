import { useState } from "react";
import { Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import Modal from "../../components/Modal";
import Badge from "../../components/Badge";

interface MedEntry {
  id: number; date: string; type: string; notes: string; vet: string;
}

const ENTRIES: MedEntry[] = [
  { id: 1, date: "2026-06-15", type: "General Checkup", notes: "Healthy. Weight 28kg. Teeth in good condition.", vet: "Dr. Khalil" },
  { id: 2, date: "2026-03-10", type: "Illness", notes: "Mild ear infection. Prescribed antibiotic drops.", vet: "Dr. Khalil" },
  { id: 3, date: "2025-11-20", type: "Surgery", notes: "Neutered. Recovery went smoothly.", vet: "Dr. Rana" },
];

interface VetMedicalPageProps { onNavigate: (page: string) => void; params?: { petId?: number }; }

export default function VetMedicalPage({ onNavigate }: VetMedicalPageProps) {
  const [entries, setEntries] = useState(ENTRIES);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MedEntry | null>(null);
  const [form, setForm] = useState({ date: "", type: "", notes: "" });

  const addEntry = () => {
    setEntries((p) => [...p, { id: Date.now(), ...form, vet: "Dr. Khalil" }]);
    setForm({ date: "", type: "", notes: "" });
    setAddOpen(false);
  };

  return (
    <DashboardLayout role="vet" activePage="vet-medical" onNavigate={onNavigate} pageTitle="Medical Records — Max" breadcrumbs={["Vet", "Pets", "Max", "Medical Records"]}>
      <div className="max-w-3xl">
        {/* Pet summary card */}
        <div className="bg-white rounded-[15px] shadow-md p-5 mb-5 flex flex-wrap gap-6 items-center">
          <div>
            <p className="font-['Poppins',sans-serif] font-semibold text-[18px] text-black">Max</p>
            <p className="font-['Poppins',sans-serif] text-[13px] text-[#089D97]">Golden Retriever · Male · 2 years</p>
          </div>
          <div className="flex gap-4 ml-auto">
            <button onClick={() => onNavigate("vet-vaccinations")} className="flex items-center gap-2 px-4 py-2 border border-[#089D97] text-[#089D97] rounded-[10px] font-['Poppins',sans-serif] text-[13px] hover:bg-[rgba(8,157,151,0.1)] transition-colors">Vaccinations</button>
            <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#089D97] text-white rounded-[10px] font-['Poppins',sans-serif] font-medium text-[13px] hover:bg-[#047975] transition-colors"><Plus size={15} /> Add Entry</button>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex flex-col gap-4">
          {entries.map((e, i) => (
            <div key={e.id} className="bg-white rounded-[15px] shadow-md p-5 relative">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <Badge label={e.type} variant="teal" />
                  <p className="font-['Poppins',sans-serif] text-[12px] text-black/50 mt-1">{e.date} · {e.vet}</p>
                </div>
                <div className="flex gap-2">
                  <button className="text-blue-400 hover:text-blue-600 transition-colors"><Edit size={15} /></button>
                  <button onClick={() => setDeleteTarget(e)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                </div>
              </div>
              <p className="font-['Poppins',sans-serif] text-[14px] text-black leading-relaxed">{e.notes}</p>
            </div>
          ))}
        </div>
      </div>

      <Modal title="Add Medical Entry" open={addOpen} onClose={() => setAddOpen(false)} onConfirm={addEntry} confirmLabel="Add Entry" size="md">
        <div className="space-y-4">
          <div>
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">Date</label>
            <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
          </div>
          <div>
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">Type</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] bg-white transition-colors">
              {["General Checkup", "Illness", "Surgery", "Dental", "Grooming", "Other"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={4} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] resize-none transition-colors" placeholder="Clinical notes..." />
          </div>
        </div>
      </Modal>

      <Modal title="Delete Entry" open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => { setEntries((p) => p.filter((e) => e.id !== deleteTarget?.id)); setDeleteTarget(null); }} confirmLabel="Delete" confirmDestructive size="sm">
        <p className="font-['Poppins',sans-serif] text-[14px] text-black">Delete the <span className="font-semibold">{deleteTarget?.type}</span> entry from {deleteTarget?.date}?</p>
      </Modal>
    </DashboardLayout>
  );
}
