import { useEffect, useMemo, useRef, useState } from "react";
import { Edit, Eye, ImagePlus, PawPrint, Plus, Search, Trash2 } from "lucide-react";
import DashboardLayout, { Role } from "../../components/DashboardLayout";
import Badge, { statusBadge } from "../../components/Badge";
import EmptyState from "../../components/EmptyState";
import Modal from "../../components/Modal";
import { apiFetch, PetResponse } from "../../lib/api";
import { validateImageFile } from "../../lib/validation";
import {
  COMMON_BREED_OPTIONS,
  COMMON_COLOR_OPTIONS,
  PET_GENDER_OPTIONS,
  PET_HEALTH_STATUS_OPTIONS,
  PET_SPECIES_OPTIONS,
  PET_STATUS_OPTIONS,
} from "../../lib/formOptions";

interface StaffPetsPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
  role?: Role;
  activePage?: string;
}

const blank = { name: "", species: PET_SPECIES_OPTIONS[0], breed: "", age: "", gender: "", color: "", weight: "", description: "", adoptionStatus: PET_STATUS_OPTIONS[0], healthStatus: "" };

export default function StaffPetsPage({ onNavigate, role = "staff", activePage = "staff-pets" }: StaffPetsPageProps) {
  const [pets, setPets] = useState<PetResponse[]>([]);
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<PetResponse | null>(null);
  const [deletePet, setDeletePet] = useState<PetResponse | null>(null);
  const [imagePet, setImagePet] = useState<PetResponse | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const canArchivePets = role === "admin" || role === "manager";
  const canUploadPetImages = role === "admin" || role === "manager" || role === "staff";

  function loadPets() {
    setLoading(true);
    setError("");
    apiFetch<PetResponse[]>("/pets")
      .then(setPets)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load pets."))
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
    const body = dto();
    if (!body.name || body.name.length > 120) {
      setError("Pet name is required and must be 120 characters or less.");
      return;
    }
    if ((body.age != null && (!Number.isInteger(body.age) || body.age < 0)) || (body.weight != null && body.weight < 0)) {
      setError("Age and weight must be valid non-negative numbers.");
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
      setError(err instanceof Error ? err.message : "Unable to save pet.");
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
      setError(err instanceof Error ? err.message : "Unable to archive pet.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(file?: File) {
    if (!imagePet || !file) return;
    const validation = validateImageFile(file);
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
      loadPets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload pet image.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout
      role={role}
      activePage={activePage}
      onNavigate={onNavigate}
      pageTitle="Manage Pets"
      breadcrumbs={[role.charAt(0).toUpperCase() + role.slice(1), "Pets"]}
    >
      <div className="bg-white rounded-[15px] shadow-md p-5">
        <div className="flex flex-wrap gap-3 mb-5 items-center">
          <div className="flex-1 min-w-[180px] relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#089D97]" />
            <input placeholder="Search pets..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-[10px] font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", ...PET_SPECIES_OPTIONS].map((s) => <button key={s} onClick={() => setSpeciesFilter(s)} className={`px-3 py-1.5 rounded-[20px] font-['Poppins',sans-serif] text-[12px] transition-colors ${speciesFilter === s ? "bg-[#089D97] text-white" : "bg-gray-100 text-black/70 hover:bg-gray-200"}`}>{s}</button>)}
          </div>
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#089D97] text-white font-['Poppins',sans-serif] font-medium text-[13px] rounded-[10px] hover:bg-[#047975] transition-colors ml-auto">
            <Plus size={16} /> Add Pet
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((n) => <div key={n} className="h-[58px] rounded-[10px] bg-gray-50 animate-pulse" />)}</div>
        ) : error ? (
          <EmptyState icon={<PawPrint size={28} />} title="Unable to load pets" description={error} actionLabel="Try again" onAction={loadPets} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<PawPrint size={28} />} title="No pets found" description="Add a pet or adjust your filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">{["Name", "Species", "Breed", "Age", "Gender", "Status", "Health", "Actions"].map((h) => <th key={h} className="py-2.5 px-3 font-['Poppins',sans-serif] font-semibold text-[11px] text-black/50 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.petId} className="border-b border-gray-50 hover:bg-[rgba(8,157,151,0.03)] transition-colors">
                    <td className="py-3 px-3 font-['Poppins',sans-serif] font-medium text-[14px] text-black">{p.name}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{p.species}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{p.breed ?? "-"}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{p.age ?? "-"}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{p.gender ?? "-"}</td>
                    <td className="py-3 px-3"><Badge label={p.adoptionStatus.toLowerCase()} variant={statusBadge(p.adoptionStatus.toLowerCase())} /></td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{p.healthStatus ?? "-"}</td>
                    <td className="py-3 px-3">
                      <div className="flex gap-2">
                        <button onClick={() => onNavigate("pet-detail", { petId: p.petId })} className="text-[#089D97] hover:text-[#047975]" aria-label="View pet"><Eye size={15} /></button>
                        <button onClick={() => openEdit(p)} className="text-blue-500 hover:text-blue-700" aria-label="Edit pet"><Edit size={15} /></button>
                        {canUploadPetImages && <button onClick={() => setImagePet(p)} className="text-amber-500 hover:text-amber-700" aria-label="Upload pet image"><ImagePlus size={15} /></button>}
                        {canArchivePets && (
                          <button onClick={() => setDeletePet(p)} className="text-red-400 hover:text-red-600" aria-label="Archive pet"><Trash2 size={15} /></button>
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

      <Modal title={editing ? "Edit Pet" : "Add New Pet"} open={addOpen} onClose={closeForm} onConfirm={savePet} confirmLabel={saving ? "Saving..." : "Save Pet"} size="md">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {error && <p className="sm:col-span-2 text-[13px] text-red-600 bg-red-50 rounded-[10px] px-3 py-2">{error}</p>}
          {[
            ["Name", "name"], ["Age", "age"], ["Weight", "weight"],
          ].map(([label, field]) => <Field key={field} label={label} value={form[field as keyof typeof form]} onChange={(value) => setForm((p) => ({ ...p, [field]: value }))} type={field === "age" || field === "weight" ? "number" : "text"} />)}
          <DatalistField id="pet-breeds" label="Breed" value={form.breed} options={COMMON_BREED_OPTIONS} onChange={(value) => setForm((p) => ({ ...p, breed: value }))} />
          <DatalistField id="pet-colors" label="Color" value={form.color} options={COMMON_COLOR_OPTIONS} onChange={(value) => setForm((p) => ({ ...p, color: value }))} />
          <SelectField label="Gender" value={form.gender} options={["", ...PET_GENDER_OPTIONS]} placeholder="Choose gender" onChange={(value) => setForm((p) => ({ ...p, gender: value }))} />
          <SelectField label="Health Status" value={form.healthStatus} options={["", ...PET_HEALTH_STATUS_OPTIONS]} placeholder="Choose health status" onChange={(value) => setForm((p) => ({ ...p, healthStatus: value }))} />
          <div>
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">Species</label>
            <select value={form.species} onChange={(e) => setForm((p) => ({ ...p, species: e.target.value }))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] bg-white outline-none focus:border-[#089D97]">
              {PET_SPECIES_OPTIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          {editing && (
            <div>
              <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">Adoption Status</label>
              <select value={form.adoptionStatus} onChange={(e) => setForm((p) => ({ ...p, adoptionStatus: e.target.value }))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] bg-white outline-none focus:border-[#089D97]">
                {PET_STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">Description</label>
            <textarea maxLength={5000} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] resize-none" />
          </div>
        </div>
      </Modal>

      <Modal title="Archive Pet" open={!!deletePet} onClose={() => setDeletePet(null)} onConfirm={archivePet} confirmLabel={saving ? "Archiving..." : "Archive"} confirmDestructive size="sm">
        <p className="font-['Poppins',sans-serif] text-[14px] text-black">Archive <span className="font-semibold">{deletePet?.name}</span>?</p>
      </Modal>

      <Modal title="Upload Pet Image" open={!!imagePet} onClose={() => setImagePet(null)} onConfirm={() => uploadImage(inputRef.current?.files?.[0])} confirmLabel={saving ? "Uploading..." : "Upload"} size="sm">
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="w-full text-[13px] font-['Poppins',sans-serif]" />
        <p className="mt-2 font-['Poppins',sans-serif] text-[12px] text-black/50">JPG, PNG or WEBP up to 5 MB. The multipart field is sent as file.</p>
      </Modal>
    </DashboardLayout>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div>
      <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{label}</label>
      <input type={type} min={type === "number" ? 0 : undefined} value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97]" />
    </div>
  );
}

function SelectField({ label, value, options, placeholder, onChange }: { label: string; value: string; options: readonly string[]; placeholder: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] bg-white outline-none focus:border-[#089D97]">
        {options.map((option) => <option key={option || "blank"} value={option}>{option || placeholder}</option>)}
      </select>
    </div>
  );
}

function DatalistField({ id, label, value, options, onChange }: { id: string; label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{label}</label>
      <input list={id} value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97]" />
      <datalist id={id}>
        {options.map((option) => <option key={option} value={option} />)}
      </datalist>
    </div>
  );
}
