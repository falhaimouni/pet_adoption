import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, ArrowLeft, Stethoscope } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import Modal from "../../components/Modal";
import Badge from "../../components/Badge";
import EmptyState from "../../components/EmptyState";
import { apiFetch } from "../../lib/api";

interface MedicalEntry {
  entryId: string;
  diagnosis: string;
  treatment: string;
  vaccinationStatus: string;
  medicalDate: string;
  notes?: string | null;
  veterinarian?: { firstName: string; lastName: string };
}

interface MedicalRecord {
  pet: { name: string; species: string; breed?: string | null; age?: number | null; gender?: string | null };
  entries: MedicalEntry[];
}

interface VetMedicalPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
  params?: { petId?: string };
}

const blank = { diagnosis: "", treatment: "", vaccinationStatus: "PENDING", medicalDate: "", notes: "" };

export default function VetMedicalPage({ onNavigate, params }: VetMedicalPageProps) {
  const petId = params?.petId;
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MedicalEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MedicalEntry | null>(null);
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  function loadRecord() {
    if (!petId) {
      setError("Choose a pet before opening medical records.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    apiFetch<MedicalRecord>(`/pets/${petId}/medical-record`)
      .then(setRecord)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load medical record."))
      .finally(() => setLoading(false));
  }

  useEffect(loadRecord, [petId]);

  function openEdit(entry: MedicalEntry) {
    setEditTarget(entry);
    setForm({
      diagnosis: entry.diagnosis,
      treatment: entry.treatment,
      vaccinationStatus: entry.vaccinationStatus,
      medicalDate: entry.medicalDate,
      notes: entry.notes ?? "",
    });
    setFormError("");
    setAddOpen(true);
  }

  async function saveEntry() {
    if (!petId) return;
    if (!form.diagnosis.trim() || !form.treatment.trim() || !form.medicalDate) {
      setFormError("Diagnosis, treatment, and medical date are required.");
      return;
    }
    const body = {
      diagnosis: form.diagnosis.trim(),
      treatment: form.treatment.trim(),
      vaccinationStatus: form.vaccinationStatus,
      notes: form.notes.trim() || undefined,
    };
    const createBody = { ...body, medicalDate: form.medicalDate };
    setSaving(true);
    setFormError("");
    try {
      await apiFetch(editTarget ? `/medical-entries/${editTarget.entryId}` : `/pets/${petId}/medical-record/entries`, {
        method: editTarget ? "PATCH" : "POST",
        body: JSON.stringify(editTarget ? body : createBody),
      });
      setForm(blank);
      setEditTarget(null);
      setAddOpen(false);
      loadRecord();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to save medical entry.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await apiFetch(`/medical-entries/${deleteTarget.entryId}`, { method: "DELETE" });
      setDeleteTarget(null);
      loadRecord();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete medical entry.");
    } finally {
      setSaving(false);
    }
  }

  const pet = record?.pet;
  const entries = record?.entries ?? [];

  return (
    <DashboardLayout role="vet" activePage="vet-medical" onNavigate={onNavigate} pageTitle={`Medical Records${pet ? ` - ${pet.name}` : ""}`} breadcrumbs={["Vet", "Pets", pet?.name ?? "Medical Records"]}>
      <div className="max-w-3xl">
        <div className="bg-white rounded-[15px] shadow-md p-5 mb-5 flex flex-wrap gap-6 items-center">
          <button onClick={() => onNavigate("vet-pets")} className="text-[#089D97] hover:text-[#047975] transition-colors" aria-label="Back to pets"><ArrowLeft size={18} /></button>
          <div>
            <p className="font-['Poppins',sans-serif] font-semibold text-[18px] text-black">{pet?.name ?? "Medical Record"}</p>
            <p className="font-['Poppins',sans-serif] text-[13px] text-[#089D97]">{[pet?.breed ?? pet?.species, pet?.gender, pet?.age == null ? null : `${pet.age} years`].filter(Boolean).join(" · ")}</p>
          </div>
          <div className="flex gap-4 ml-auto">
            {petId && <button onClick={() => onNavigate("vet-vaccinations", { petId })} className="flex items-center gap-2 px-4 py-2 border border-[#089D97] text-[#089D97] rounded-[10px] font-['Poppins',sans-serif] text-[13px] hover:bg-[rgba(8,157,151,0.1)] transition-colors">Vaccinations</button>}
            <button onClick={() => { setEditTarget(null); setForm(blank); setFormError(""); setAddOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-[#089D97] text-white rounded-[10px] font-['Poppins',sans-serif] font-medium text-[13px] hover:bg-[#047975] transition-colors"><Plus size={15} /> Add Entry</button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((n) => <div key={n} className="h-[110px] rounded-[15px] bg-white animate-pulse" />)}</div>
        ) : error ? (
          <div className="bg-white rounded-[15px] shadow-md p-5"><EmptyState icon={<Stethoscope size={28} />} title="Unable to load medical records" description={error} actionLabel="Try again" onAction={loadRecord} /></div>
        ) : entries.length === 0 ? (
          <div className="bg-white rounded-[15px] shadow-md p-5"><EmptyState icon={<Stethoscope size={28} />} title="No medical entries" description="Add the first medical entry for this pet." /></div>
        ) : (
          <div className="flex flex-col gap-4">
            {entries.map((entry) => (
              <div key={entry.entryId} className="bg-white rounded-[15px] shadow-md p-5 relative">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <Badge label={entry.vaccinationStatus} variant="teal" />
                    <p className="font-['Poppins',sans-serif] text-[12px] text-black/50 mt-1">{entry.medicalDate} · {[entry.veterinarian?.firstName, entry.veterinarian?.lastName].filter(Boolean).join(" ") || "Vet"}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(entry)} className="text-blue-400 hover:text-blue-600 transition-colors"><Edit size={15} /></button>
                    <button onClick={() => setDeleteTarget(entry)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                  </div>
                </div>
                <p className="font-['Poppins',sans-serif] text-[14px] text-black font-semibold">{entry.diagnosis}</p>
                <p className="font-['Poppins',sans-serif] text-[13px] text-black/70 mt-1">{entry.treatment}</p>
                {entry.notes && <p className="font-['Poppins',sans-serif] text-[12px] text-black/50 mt-2">{entry.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal title={editTarget ? "Edit Medical Entry" : "Add Medical Entry"} open={addOpen} onClose={() => { setAddOpen(false); setEditTarget(null); }} onConfirm={saveEntry} confirmLabel={saving ? "Saving..." : editTarget ? "Save Changes" : "Add Entry"} size="md">
        <div className="space-y-4">
          {formError && <p className="text-[13px] text-red-600 bg-red-50 rounded-[10px] px-3 py-2">{formError}</p>}
          <div>
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">Medical Date</label>
            <input type="date" value={form.medicalDate} disabled={!!editTarget} onChange={(e) => setForm((f) => ({ ...f, medicalDate: e.target.value }))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors disabled:bg-gray-50 disabled:text-black/50" />
          </div>
          <div>
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">Vaccination Status</label>
            <select value={form.vaccinationStatus} onChange={(e) => setForm((f) => ({ ...f, vaccinationStatus: e.target.value }))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] bg-white transition-colors">
              {["VACCINATED", "PENDING", "OVERDUE"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">Diagnosis</label>
            <textarea value={form.diagnosis} onChange={(e) => setForm((f) => ({ ...f, diagnosis: e.target.value }))} rows={3} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] resize-none transition-colors" />
          </div>
          <div>
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">Treatment</label>
            <textarea value={form.treatment} onChange={(e) => setForm((f) => ({ ...f, treatment: e.target.value }))} rows={3} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] resize-none transition-colors" />
          </div>
          <div>
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] resize-none transition-colors" />
          </div>
        </div>
      </Modal>

      <Modal title="Delete Entry" open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={deleteEntry} confirmLabel={saving ? "Deleting..." : "Delete"} confirmDestructive size="sm">
        <p className="font-['Poppins',sans-serif] text-[14px] text-black">Delete the <span className="font-semibold">{deleteTarget?.diagnosis}</span> entry from {deleteTarget?.medicalDate}?</p>
      </Modal>
    </DashboardLayout>
  );
}
