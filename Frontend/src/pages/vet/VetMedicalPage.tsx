import { useEffect, useMemo, useState } from "react";
import { Plus, Edit, Trash2, ArrowLeft, Stethoscope } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import Modal from "../../components/Modal";
import Badge from "../../components/Badge";
import EmptyState from "../../components/EmptyState";
import { apiFetch, PetResponse } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext";

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
  const { t } = useLanguage();
  const routePetId = params?.petId;
  const [selectedPetId, setSelectedPetId] = useState(routePetId ?? "");
  const effectivePetId = routePetId ?? selectedPetId;
  const [pets, setPets] = useState<PetResponse[]>([]);
  const [petsLoading, setPetsLoading] = useState(true);
  const [petsError, setPetsError] = useState("");
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MedicalEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MedicalEntry | null>(null);
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setPetsLoading(true);
    setPetsError("");
    apiFetch<PetResponse[]>("/pets")
      .then((data) => {
        if (!cancelled) {
          setPets(data);
          if (!routePetId && data[0]) setSelectedPetId((current) => current || data[0].petId);
        }
      })
      .catch((err) => {
        if (!cancelled) setPetsError(err instanceof Error ? err.message : t("pets_load_error"));
      })
      .finally(() => {
        if (!cancelled) setPetsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [routePetId]);

  function loadRecord() {
    if (!effectivePetId) {
      setRecord(null);
      setError("");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    apiFetch<MedicalRecord>(`/pets/${effectivePetId}/medical-record`)
      .then(setRecord)
      .catch((err) => setError(err instanceof Error ? err.message : t("medical_record_load_error")))
      .finally(() => setLoading(false));
  }

  useEffect(loadRecord, [effectivePetId]);

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
    if (!effectivePetId) {
      setFormError(t("medical_choose_pet_error"));
      return;
    }
    if (!form.diagnosis.trim() || !form.treatment.trim() || !form.medicalDate) {
      setFormError(t("medical_required_error"));
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
      await apiFetch(editTarget ? `/medical-entries/${editTarget.entryId}` : `/pets/${effectivePetId}/medical-record/entries`, {
        method: editTarget ? "PATCH" : "POST",
        body: JSON.stringify(editTarget ? body : createBody),
      });
      setForm(blank);
      setEditTarget(null);
      setAddOpen(false);
      loadRecord();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t("medical_save_error"));
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
      setError(err instanceof Error ? err.message : t("medical_delete_error"));
    } finally {
      setSaving(false);
    }
  }

  const pet = record?.pet;
  const selectedPet = useMemo(() => pets.find((item) => item.petId === effectivePetId), [pets, effectivePetId]);
  const displayPet = pet ?? selectedPet;
  const entries = record?.entries ?? [];

  return (
    <DashboardLayout role="vet" activePage="vet-medical" onNavigate={onNavigate} pageTitle={`${t("vet_medical_records")}${displayPet ? ` - ${displayPet.name}` : ""}`} breadcrumbs={[t("role_vet"), t("dash_pets"), displayPet?.name ?? t("vet_medical_records")]}>
      <div className="max-w-3xl">
        <div className="bg-white rounded-[15px] shadow-md p-5 mb-5 flex flex-wrap gap-6 items-center">
          <button onClick={() => onNavigate("vet-pets")} className="text-[#089D97] hover:text-[#047975] transition-colors" aria-label={t("pet_back_to_pets")}><ArrowLeft size={18} /></button>
          <div>
            <p className="font-['Poppins',sans-serif] font-semibold text-[18px] text-black">{displayPet?.name ?? t("medical_record")}</p>
            <p className="font-['Poppins',sans-serif] text-[13px] text-[#089D97]">{[displayPet?.breed ?? displayPet?.species, displayPet?.gender, displayPet?.age == null ? null : `${displayPet.age} ${displayPet.age === 1 ? t("common_year") : t("common_years")}`].filter(Boolean).join(" · ")}</p>
          </div>
          <div className="flex gap-4 ml-auto">
            {effectivePetId && <button onClick={() => onNavigate("vet-vaccinations", { petId: effectivePetId })} className="flex items-center gap-2 px-4 py-2 border border-[#089D97] text-[#089D97] rounded-[10px] font-['Poppins',sans-serif] text-[13px] hover:bg-[rgba(8,157,151,0.1)] transition-colors">{t("vet_vaccinations")}</button>}
            <button disabled={!effectivePetId} onClick={() => { setEditTarget(null); setForm(blank); setFormError(""); setAddOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-[#089D97] text-white rounded-[10px] font-['Poppins',sans-serif] font-medium text-[13px] hover:bg-[#047975] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><Plus size={15} /> {t("vet_add_entry")}</button>
          </div>
        </div>

        {!routePetId && (
          <div className="bg-white rounded-[15px] shadow-md p-5 mb-5">
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{t("req_pet")}</label>
            <select value={selectedPetId} onChange={(e) => setSelectedPetId(e.target.value)} disabled={petsLoading || pets.length === 0} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] bg-white transition-colors disabled:opacity-60">
              <option value="">{petsLoading ? t("loading_pets") : pets.length === 0 ? t("no_pets_available") : t("choose_pet")}</option>
              {pets.map((item) => <option key={item.petId} value={item.petId}>{item.name} - {item.species}{item.breed ? `, ${item.breed}` : ""}</option>)}
            </select>
            {petsError && <p className="mt-2 font-['Poppins',sans-serif] text-[12px] text-red-600">{petsError}</p>}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((n) => <div key={n} className="h-[110px] rounded-[15px] bg-white animate-pulse" />)}</div>
        ) : error ? (
          <div className="bg-white rounded-[15px] shadow-md p-5"><EmptyState icon={<Stethoscope size={28} />} title={t("medical_records_load_error")} description={error} actionLabel={t("common_try_again")} onAction={loadRecord} /></div>
        ) : entries.length === 0 ? (
          <div className="bg-white rounded-[15px] shadow-md p-5"><EmptyState icon={<Stethoscope size={28} />} title={t("medical_no_entries")} description={t("medical_no_entries_desc")} /></div>
        ) : (
          <div className="flex flex-col gap-4">
            {entries.map((entry) => (
              <div key={entry.entryId} className="bg-white rounded-[15px] shadow-md p-5 relative">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <Badge label={entry.vaccinationStatus} variant="teal" />
                    <p className="font-['Poppins',sans-serif] text-[12px] text-black/50 mt-1">{entry.medicalDate} · {[entry.veterinarian?.firstName, entry.veterinarian?.lastName].filter(Boolean).join(" ") || t("role_vet")}</p>
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

      <Modal title={editTarget ? t("vet_edit_entry") : t("medical_add_entry")} open={addOpen} onClose={() => { setAddOpen(false); setEditTarget(null); }} onConfirm={saveEntry} confirmLabel={saving ? t("common_saving") : editTarget ? t("action_save_changes") : t("vet_add_entry")} size="md">
        <div className="space-y-4">
          {formError && <p className="text-[13px] text-red-600 bg-red-50 rounded-[10px] px-3 py-2">{formError}</p>}
          <div>
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{t("th_medical_date")}</label>
            <input type="date" value={form.medicalDate} disabled={!!editTarget} onChange={(e) => setForm((f) => ({ ...f, medicalDate: e.target.value }))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors disabled:bg-gray-50 disabled:text-black/50" />
          </div>
          <div>
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{t("th_vaccination_status")}</label>
            <select value={form.vaccinationStatus} onChange={(e) => setForm((f) => ({ ...f, vaccinationStatus: e.target.value }))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] bg-white transition-colors">
              {["VACCINATED", "PENDING", "OVERDUE"].map((s) => <option key={s} value={s}>{t(`vaccination_status_${s.toLowerCase()}`)}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{t("th_diagnosis")}</label>
            <textarea value={form.diagnosis} onChange={(e) => setForm((f) => ({ ...f, diagnosis: e.target.value }))} rows={3} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] resize-none transition-colors" />
          </div>
          <div>
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{t("th_treatment")}</label>
            <textarea value={form.treatment} onChange={(e) => setForm((f) => ({ ...f, treatment: e.target.value }))} rows={3} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] resize-none transition-colors" />
          </div>
          <div>
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{t("th_notes")}</label>
            <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] resize-none transition-colors" />
          </div>
        </div>
      </Modal>

      <Modal title={t("medical_delete_entry")} open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={deleteEntry} confirmLabel={saving ? t("common_deleting") : t("action_delete")} confirmDestructive size="sm">
        <p className="font-['Poppins',sans-serif] text-[14px] text-black">{t("medical_delete_confirm").replace("{diagnosis}", deleteTarget?.diagnosis ?? "").replace("{date}", deleteTarget?.medicalDate ?? "")}</p>
      </Modal>
    </DashboardLayout>
  );
}
