import { useText } from "../../i18n/useText";
import { formSchemas, validateFields, validationMessage } from "../../lib/formValidation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Edit, Eye, ImagePlus, PawPrint, Plus, Search, Trash2 } from "lucide-react";
import DashboardLayout, { Role } from "../../components/DashboardLayout";
import Badge, { statusBadge } from "../../components/Badge";
import EmptyState from "../../components/EmptyState";
import Modal from "../../components/Modal";
import { apiFetch, PaginatedResponse, PetResponse } from "../../lib/api";
import { validateImageFile } from "../../lib/validation";
import {
  COMMON_BREED_OPTIONS,
  COMMON_COLOR_OPTIONS,
  PET_GENDER_OPTIONS,
  PET_HEALTH_STATUS_OPTIONS,
  PET_SPECIES_OPTIONS,
  PET_STATUS_OPTIONS,
} from "../../lib/formOptions";
import { useLanguage } from "../../context/LanguageContext";

interface StaffPetsPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
  role?: Role;
  activePage?: string;
}

const blank: Record<"name" | "species" | "breed" | "age" | "gender" | "color" | "weight" | "description" | "adoptionStatus" | "healthStatus", string> = { name: "", species: PET_SPECIES_OPTIONS[0], breed: "", age: "", gender: "", color: "", weight: "", description: "", adoptionStatus: PET_STATUS_OPTIONS[0], healthStatus: "" };

export default function StaffPetsPage({ onNavigate, role = "employee", activePage = "staff-pets" }: StaffPetsPageProps) {
  const tx = useText();
  const { t } = useLanguage();
  const [pets, setPets] = useState<PetResponse[]>([]);
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<PetResponse | null>(null);
  const [deletePet, setDeletePet] = useState<PetResponse | null>(null);
  const [imagePet, setImagePet] = useState<PetResponse | null>(null);
  const [selectedImageName, setSelectedImageName] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const canArchivePets = role === "admin" || role === "manager";
  const canUploadPetImages = role === "admin" || role === "manager" || role === "employee";

  function loadPets() {
    setLoading(true);
    setError("");
    apiFetch<PaginatedResponse<PetResponse>>("/pets?limit=100&sortBy=name&order=ASC")
      .then((response) => setPets(response.data))
      .catch((err) => setError(err instanceof Error ? err.message : t("pets_load_error")))
      .finally(() => setLoading(false));
  }

  useEffect(loadPets, []);

  const filtered = useMemo(() => pets.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.breed ?? "").toLowerCase().includes(search.toLowerCase());
    const matchSpecies = speciesFilter === "all" || p.species === speciesFilter;
    return matchSearch && matchSpecies;
  }), [pets, search, speciesFilter]);

  function openEdit(pet: PetResponse) {
    setEditing(pet);
    setForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed ?? "",
      age: pet.age == null ? "" : String(pet.age),
      gender: pet.gender ?? "",
      color: pet.color ?? "",
      weight: pet.weight == null ? "" : String(pet.weight),
      description: pet.description ?? "",
      adoptionStatus: pet.adoptionStatus,
      healthStatus: pet.healthStatus ?? "",
    });
    setAddOpen(true);
  }

  function closeForm() {
    setAddOpen(false);
    setEditing(null);
    setForm(blank);
    setError("");
  }

  function dto() {
    return {
      name: form.name.trim(),
      species: form.species,
      breed: form.breed.trim() || undefined,
      age: form.age === "" ? undefined : Number(form.age),
      gender: form.gender.trim() || undefined,
      color: form.color.trim() || undefined,
      weight: form.weight === "" ? undefined : Number(form.weight),
      description: form.description.trim() || undefined,
      ...(editing ? { adoptionStatus: form.adoptionStatus, healthStatus: form.healthStatus.trim() || undefined } : {}),
    };
  }

  async function savePet() {
    const fieldErrors = validateFields(formSchemas.pet, form, t, { mockIds: true });
    if (Object.keys(fieldErrors).length) { setError(validationMessage(fieldErrors, t)); return; }

    const body = dto();
    if (!body.name || body.name.length > 120) {
      setError(t("pet_name_required"));
      return;
    }
    if ((body.age != null && (!Number.isInteger(body.age) || body.age < 0)) || (body.weight != null && body.weight < 0)) {
      setError(t("pet_age_weight_error"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const saved = await apiFetch<PetResponse>(editing ? `/pets/${editing.petId}` : "/pets", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });
      setPets((prev) => editing ? prev.map((p) => p.petId === saved.petId ? saved : p) : [saved, ...prev]);
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("pet_save_error"));
    } finally {
      setSaving(false);
    }
  }

  async function archivePet() {
    if (!deletePet) return;
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/pets/${deletePet.petId}`, { method: "DELETE" });
      setPets((prev) => prev.filter((p) => p.petId !== deletePet.petId));
      setDeletePet(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("pet_archive_error"));
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(file?: File) {
    if (!imagePet) return;
    if (!file) {
      setError(tx("Please choose an image file first."));
      return;
    }
    const validation = validateImageFile(file, t);
    if (validation) {
      setError(validation);
      return;
    }
    const body = new FormData();
    body.append("file", file);
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/pets/${imagePet.petId}/images`, { method: "POST", body });
      setImagePet(null);
      setSelectedImageName("");
      loadPets();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("pet_upload_error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout
      role={role}
      activePage={activePage}
      onNavigate={onNavigate}
      pageTitle={t("manage_pets_title")}
      breadcrumbs={[t(`role_${role}`), t("nav_pets")]}
    >
      <div className="bg-white rounded-[15px] shadow-md p-5">
        <div className="flex flex-wrap gap-3 mb-5 items-center">
          <div className="flex-1 min-w-[180px] relative">
            <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-[#089D97]" />
            <input placeholder={t("pets_search")} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full ps-8 pe-3 py-2 border border-gray-200 rounded-[10px] font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", ...PET_SPECIES_OPTIONS].map((s) => <button key={s} onClick={() => setSpeciesFilter(s)} className={`px-3 py-1.5 rounded-[20px] font-['Poppins',sans-serif] text-[12px] transition-colors ${speciesFilter === s ? "bg-[#089D97] text-white" : "bg-gray-100 text-black/70 hover:bg-gray-200"}`}>{s === "all" ? t("status_all") : t(`species_${s.toLowerCase()}`)}</button>)}
          </div>
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#089D97] text-white font-['Poppins',sans-serif] font-medium text-[13px] rounded-[10px] hover:bg-[#047975] transition-colors ms-auto">
            <Plus size={16} /> {t("action_add_pet")}
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((n) => <div key={n} className="h-[58px] rounded-[10px] bg-gray-50 animate-pulse" />)}</div>
        ) : error ? (
          <EmptyState icon={<PawPrint size={28} />} title={t("pets_load_error")} description={error} actionLabel={t("action_try_again")} onAction={loadPets} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<PawPrint size={28} />} title={t("pets_empty_title")} description={t("pets_empty_desc")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead>
                <tr className="border-b border-gray-100">{[t("pet_table_name"), t("pet_table_species"), t("pet_table_breed"), t("pet_table_age"), t("pet_table_gender"), t("pet_table_status"), t("pet_table_health"), t("table_actions")].map((h) => <th key={h} className="py-2.5 px-3 font-['Poppins',sans-serif] font-semibold text-[11px] text-black/50 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.petId} className="border-b border-gray-50 hover:bg-[rgba(8,157,151,0.03)] transition-colors">
                    <td className="py-3 px-3 font-['Poppins',sans-serif] font-medium text-[14px] text-black">{p.name}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{t(`species_${p.species.toLowerCase()}`)}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{p.breed ?? "-"}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{p.age ?? "-"}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{p.gender ? t(`gender_${p.gender.toLowerCase()}`) : "-"}</td>
                    <td className="py-3 px-3"><Badge label={t(`pet_status_${p.adoptionStatus.toLowerCase()}`)} variant={statusBadge(p.adoptionStatus.toLowerCase())} /></td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{p.healthStatus ?? "-"}</td>
                    <td className="py-3 px-3">
                      <div className="flex gap-2">
                        <button onClick={() => onNavigate("pet-detail", { petId: p.petId })} className="text-[#089D97] hover:text-[#047975]" aria-label={t("aria_view_pet")}><Eye size={15} /></button>
                        <button onClick={() => openEdit(p)} className="text-blue-500 hover:text-blue-700" aria-label={t("aria_edit_pet")}><Edit size={15} /></button>
                        {canUploadPetImages && <button onClick={() => { setImagePet(p); setSelectedImageName(""); if (inputRef.current) inputRef.current.value = ""; }} className="text-amber-500 hover:text-amber-700" aria-label={t("aria_upload_pet_image")}><ImagePlus size={15} /></button>}
                        {canArchivePets && (
                          <button onClick={() => setDeletePet(p)} className="text-red-400 hover:text-red-600" aria-label={t("aria_archive_pet")}><Trash2 size={15} /></button>
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

      <Modal title={editing ? t("pet_edit") : t("pet_add_new")} open={addOpen} onClose={closeForm} onConfirm={savePet} confirmLabel={saving ? t("common_saving") : t("pet_save")} size="md">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {error && <p role="alert" className="whitespace-pre-line sm:col-span-2 text-[13px] text-red-600 bg-red-50 rounded-[10px] px-3 py-2">{error}</p>}
          {[
            [t("pet_field_name"), "name"], [t("pet_field_age"), "age"], [t("pet_field_weight"), "weight"],
          ].map(([label, field]) => <Field key={field} label={label} value={form[field as keyof typeof form]} onChange={(value) => setForm((p) => ({ ...p, [field]: value }))} type={field === "age" || field === "weight" ? "number" : "text"} />)}
          <DatalistField id="pet-breeds" label={t("pet_field_breed")} value={form.breed} options={COMMON_BREED_OPTIONS} onChange={(value) => setForm((p) => ({ ...p, breed: value }))} />
          <DatalistField id="pet-colors" label={t("pet_field_color")} value={form.color} options={COMMON_COLOR_OPTIONS} onChange={(value) => setForm((p) => ({ ...p, color: value }))} />
          <SelectField label={t("pet_field_gender")} value={form.gender} options={["", ...PET_GENDER_OPTIONS]} placeholder={t("pet_choose_gender")} onChange={(value) => setForm((p) => ({ ...p, gender: value }))} translateOption={(value) => value ? t(`gender_${value.toLowerCase()}`) : value} />
          <SelectField label={t("pet_field_health_status")} value={form.healthStatus} options={["", ...PET_HEALTH_STATUS_OPTIONS]} translateOption={tx} placeholder={t("pet_choose_health")} onChange={(value) => setForm((p) => ({ ...p, healthStatus: value }))} />
          <div>
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{t("pet_field_species")}</label>
            <select value={form.species} onChange={(e) => setForm((p) => ({ ...p, species: e.target.value }))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] bg-white outline-none focus:border-[#089D97]">
              {PET_SPECIES_OPTIONS.map((s) => <option key={s} value={s}>{t(`species_${s.toLowerCase()}`)}</option>)}
            </select>
          </div>
          {editing && (
            <div>
              <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{t("pet_field_adoption_status")}</label>
              <select value={form.adoptionStatus} onChange={(e) => setForm((p) => ({ ...p, adoptionStatus: e.target.value }))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] bg-white outline-none focus:border-[#089D97]">
                {PET_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{t(`pet_status_${s.toLowerCase()}`)}</option>)}
              </select>
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{t("field_description")}</label>
            <textarea maxLength={5000} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] resize-none" />
          </div>
        </div>
      </Modal>

      <Modal title={t("pet_archive")} open={!!deletePet} onClose={() => setDeletePet(null)} onConfirm={archivePet} confirmLabel={saving ? t("pet_archiving") : t("pet_archive")} confirmDestructive size="sm">
        <p className="font-['Poppins',sans-serif] text-[14px] text-black">{t("pet_archive_confirm").replace("{name}", deletePet?.name ?? "")}</p>
      </Modal>

      <Modal title={t("pet_upload_image")} open={!!imagePet} onClose={() => { setImagePet(null); setSelectedImageName(""); }} onConfirm={() => uploadImage(inputRef.current?.files?.[0])} confirmLabel={saving ? t("pet_uploading") : t("action_upload")} size="sm">
        <input
          ref={inputRef}
          id="pet-image-upload"
          type="file"
          accept="image/*,.jpg,.jpeg,.png,.webp"
          className="sr-only"
          onChange={(event) => setSelectedImageName(event.target.files?.[0]?.name ?? "")}
        />
        <label
          htmlFor="pet-image-upload"
          className="flex min-h-[132px] cursor-pointer flex-col items-center justify-center rounded-[14px] border-2 border-dashed border-[#089D97]/35 bg-[#f0f9f8] px-4 py-5 text-center transition-colors hover:border-[#089D97] hover:bg-[#e4f5f3] focus-within:border-[#089D97]"
        >
          <ImagePlus size={28} className="mb-2 text-[#089D97]" />
          <span className="font-['Poppins',sans-serif] text-[14px] font-semibold text-[#1a2e2d]">
            {selectedImageName || tx("Choose an image")}
          </span>
          <span className="mt-1 font-['Poppins',sans-serif] text-[12px] text-black/50">
            {selectedImageName ? tx("Click to choose a different file") : t("pet_upload_hint")}
          </span>
        </label>
      </Modal>
    </DashboardLayout>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div>
      <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{label}</label>
      <input aria-label={label} maxLength={120} step={type === "number" ? "any" : undefined} type={type} min={type === "number" ? 0 : undefined} value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97]" />
    </div>
  );
}

function SelectField({ label, value, options, placeholder, onChange, translateOption }: { label: string; value: string; options: readonly string[]; placeholder: string; onChange: (value: string) => void; translateOption?: (value: string) => string }) {
  return (
    <div>
      <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{label}</label>
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] bg-white outline-none focus:border-[#089D97]">
        {options.map((option) => <option key={option || "blank"} value={option}>{option ? translateOption?.(option) ?? option : placeholder}</option>)}
      </select>
    </div>
  );
}

function DatalistField({ id, label, value, options, onChange }: { id: string; label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  const tx = useText();
  return (
    <div>
      <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{label}</label>
      <input aria-label={label} maxLength={id === "pet-colors" ? 80 : 120} list={id} value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97]" />
      <datalist id={id}>
        {options.map((option) => <option key={option} value={option} label={tx(option)} />)}
      </datalist>
    </div>
  );
}
