import { useEffect, useMemo, useState } from "react";
import { Plus, Edit, Trash2, Syringe } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import Badge, { statusBadge } from "../../components/Badge";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import { apiFetch, PaginatedResponse, PetResponse } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext";

interface Vaccination {
  vaccinationId: string;
  vaccineName: string;
  vaccinationDate: string;
  nextDueDate?: string | null;
  batch?: string | null;
  status?: string;
  notes?: string | null;
  pet?: { name: string; species: string };
  veterinarian?: { firstName: string; lastName: string };
}

interface VetVaccinationsPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
  params?: { petId?: string };
}

const blank = { vaccineName: "", vaccinationDate: "", nextDueDate: "", batch: "", status: "VACCINATED", notes: "" };

function displayStatus(vaccine: Vaccination) {
  if (vaccine.status) return vaccine.status;
  if (vaccine.nextDueDate && new Date(vaccine.nextDueDate) < new Date()) return "OVERDUE";
  return "VACCINATED";
}

export default function VetVaccinationsPage({ onNavigate, params }: VetVaccinationsPageProps) {
  const { t } = useLanguage();
  const routePetId = params?.petId;
  const [selectedPetId, setSelectedPetId] = useState(routePetId ?? "");
  const effectivePetId = routePetId ?? selectedPetId;
  const [pets, setPets] = useState<PetResponse[]>([]);
  const [petsLoading, setPetsLoading] = useState(true);
  const [petsError, setPetsError] = useState("");
  const [vaccines, setVaccines] = useState<Vaccination[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Vaccination | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vaccination | null>(null);
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setPetsLoading(true);
    setPetsError("");
    apiFetch<PaginatedResponse<PetResponse>>("/pets?limit=100&sortBy=name&order=ASC")
      .then((response) => {
        if (!cancelled) {
          const data = response.data;
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

  function loadVaccines() {
    if (!effectivePetId) {
      setVaccines([]);
      setError("");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    apiFetch<Vaccination[]>(`/pets/${effectivePetId}/vaccinations`)
      .then(setVaccines)
      .catch((err) => setError(err instanceof Error ? err.message : t("vaccinations_load_error")))
      .finally(() => setLoading(false));
  }

  useEffect(loadVaccines, [effectivePetId]);

  const selectedPet = useMemo(() => pets.find((item) => item.petId === effectivePetId), [pets, effectivePetId]);
  const petName = vaccines[0]?.pet?.name ?? selectedPet?.name ?? t("req_pet");

  function openEdit(vaccine: Vaccination) {
    setEditTarget(vaccine);
    setForm({
      vaccineName: vaccine.vaccineName,
      vaccinationDate: vaccine.vaccinationDate,
      nextDueDate: vaccine.nextDueDate ?? "",
      batch: vaccine.batch ?? "",
      status: displayStatus(vaccine),
      notes: vaccine.notes ?? "",
    });
    setFormError("");
    setAddOpen(true);
  }

  async function saveVaccine() {
    if (!effectivePetId) {
      setFormError(t("vaccination_choose_pet_error"));
      return;
    }
    if (!form.vaccineName.trim() || !form.vaccinationDate) {
      setFormError(t("vaccination_required_error"));
      return;
    }
    const body = {
      vaccineName: form.vaccineName.trim(),
      vaccinationDate: form.vaccinationDate,
      nextDueDate: form.nextDueDate || undefined,
      batch: form.batch.trim() || undefined,
      status: form.status,
      notes: form.notes.trim() || undefined,
    };
    setSaving(true);
    setFormError("");
    try {
      await apiFetch(editTarget ? `/vaccinations/${editTarget.vaccinationId}` : `/pets/${effectivePetId}/vaccinations`, {
        method: editTarget ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });
      setForm(blank);
      setEditTarget(null);
      setAddOpen(false);
      loadVaccines();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t("vaccination_save_error"));
    } finally {
      setSaving(false);
    }
  }

  async function deleteVaccine() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await apiFetch(`/vaccinations/${deleteTarget.vaccinationId}`, { method: "DELETE" });
      setDeleteTarget(null);
      loadVaccines();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("vaccination_delete_error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout role="vet" activePage="vet-vaccinations" onNavigate={onNavigate} pageTitle={`${t("vet_vaccinations")} - ${petName}`} breadcrumbs={[t("role_vet"), t("dash_pets"), petName, t("vet_vaccinations")]}>
      <div className="max-w-3xl">
        <div className="bg-white rounded-[15px] shadow-md p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black">{t("vaccination_records")}</h3>
            <button disabled={!effectivePetId} onClick={() => { setEditTarget(null); setForm(blank); setFormError(""); setAddOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-[#089D97] text-white rounded-[10px] font-['Poppins',sans-serif] font-medium text-[13px] hover:bg-[#047975] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Plus size={15} /> {t("vaccination_add_vaccine")}
            </button>
          </div>

          {!routePetId && (
            <div className="mb-5">
              <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{t("req_pet")}</label>
              <select value={selectedPetId} onChange={(e) => setSelectedPetId(e.target.value)} disabled={petsLoading || pets.length === 0} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] bg-white transition-colors disabled:opacity-60">
                <option value="">{petsLoading ? t("loading_pets") : pets.length === 0 ? t("no_pets_available") : t("choose_pet")}</option>
                {pets.map((item) => <option key={item.petId} value={item.petId}>{item.name} - {item.species}{item.breed ? `, ${item.breed}` : ""}</option>)}
              </select>
              {petsError && <p className="mt-2 font-['Poppins',sans-serif] text-[12px] text-red-600">{petsError}</p>}
            </div>
          )}

          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map((n) => <div key={n} className="h-[56px] rounded-[10px] bg-gray-50 animate-pulse" />)}</div>
          ) : error ? (
            <EmptyState icon={<Syringe size={28} />} title={t("vaccinations_load_error")} description={error} actionLabel={t("common_try_again")} onAction={loadVaccines} />
          ) : vaccines.length === 0 ? (
            <EmptyState icon={<Syringe size={28} />} title={t("vaccinations_empty_title")} description={t("vaccinations_empty_desc")} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    {[t("th_vaccine"), t("th_date_given"), t("th_next_due"), t("th_batch"), t("role_vet"), t("th_status"), t("th_notes"), t("th_actions")].map((h) => (
                      <th key={h} className="py-2.5 px-3 font-['Poppins',sans-serif] font-semibold text-[11px] text-black/50 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vaccines.map((v) => {
                    const status = displayStatus(v);
                    return (
                      <tr key={v.vaccinationId} className="border-b border-gray-50 hover:bg-[rgba(8,157,151,0.03)] transition-colors">
                        <td className="py-3 px-3 font-['Poppins',sans-serif] font-medium text-[14px] text-black">{v.vaccineName}</td>
                        <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{v.vaccinationDate}</td>
                        <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{v.nextDueDate ?? "-"}</td>
                        <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{v.batch ?? "-"}</td>
                        <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/50">{[v.veterinarian?.firstName, v.veterinarian?.lastName].filter(Boolean).join(" ") || "-"}</td>
                        <td className="py-3 px-3"><Badge label={status.toLowerCase()} variant={statusBadge(status.toLowerCase())} /></td>
                        <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/50 max-w-[180px] truncate">{v.notes ?? "-"}</td>
                        <td className="py-3 px-3">
                          <div className="flex gap-2">
                            <button onClick={() => openEdit(v)} className="text-blue-400 hover:text-blue-600 transition-colors"><Edit size={15} /></button>
                            <button onClick={() => setDeleteTarget(v)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal title={editTarget ? t("vet_edit_vaccination") : t("vet_add_vaccination")} open={addOpen} onClose={() => { setAddOpen(false); setEditTarget(null); }} onConfirm={saveVaccine} confirmLabel={saving ? t("common_saving") : editTarget ? t("action_save_changes") : t("action_add")} size="md">
        <div className="grid grid-cols-2 gap-4">
          {formError && <p className="col-span-2 text-[13px] text-red-600 bg-red-50 rounded-[10px] px-3 py-2">{formError}</p>}
          <div className="col-span-2">
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{t("vaccination_vaccine_name")}</label>
            <input value={form.vaccineName} onChange={(e) => setForm((f) => ({ ...f, vaccineName: e.target.value }))} placeholder={t("vaccination_vaccine_name_ph")} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
          </div>
          <div>
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{t("th_date_given")}</label>
            <input type="date" value={form.vaccinationDate} onChange={(e) => setForm((f) => ({ ...f, vaccinationDate: e.target.value }))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
          </div>
          <div>
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{t("th_next_due")}</label>
            <input type="date" value={form.nextDueDate} onChange={(e) => setForm((f) => ({ ...f, nextDueDate: e.target.value }))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
          </div>
          <div>
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{t("th_batch")}</label>
            <input value={form.batch} onChange={(e) => setForm((f) => ({ ...f, batch: e.target.value }))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
          </div>
          <div>
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{t("th_status")}</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] bg-white transition-colors">
              {["VACCINATED", "PENDING", "OVERDUE"].map((s) => <option key={s} value={s}>{t(`vaccination_status_${s.toLowerCase()}`)}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{t("th_notes")}</label>
            <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] resize-none transition-colors" />
          </div>
        </div>
      </Modal>

      <Modal title={t("vaccination_delete_vaccine")} open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={deleteVaccine} confirmLabel={saving ? t("common_deleting") : t("action_delete")} confirmDestructive size="sm">
        <p className="font-['Poppins',sans-serif] text-[14px] text-black">{t("vaccination_delete_confirm").replace("{name}", deleteTarget?.vaccineName ?? "")}</p>
      </Modal>
    </DashboardLayout>
  );
}
