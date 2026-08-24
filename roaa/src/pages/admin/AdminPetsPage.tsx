import { useMemo, useRef, useState } from "react";
import { Camera, Eye, Heart, Plus, Search, Trash2, Upload, X } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import Badge, { statusBadge } from "../../components/Badge";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";

interface AdminPet {
  id: number;
  name: string;
  species: string;
  breed: string;
  age: string;
  gender: string;
  city: string;
  status: "available" | "pending" | "adopted";
  image: string;
  description: string;
  vaccinated: boolean;
  neutered: boolean;
  shelterName: string;
  tags: string[];
}

const INITIAL_PETS: AdminPet[] = [
  {
    id: 1,
    name: "Mochi",
    species: "Dog",
    breed: "Golden Retriever",
    age: "2 years",
    gender: "Male",
    city: "Amman",
    status: "available",
    image: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=80",
    description: "Friendly, trained, and ready for a loving home.",
    vaccinated: true,
    neutered: false,
    shelterName: "Petopia Amman Shelter",
    tags: ["Family-friendly", "Trained"],
  },
  {
    id: 2,
    name: "Luna",
    species: "Cat",
    breed: "Persian",
    age: "1 year",
    gender: "Female",
    city: "Irbid",
    status: "pending",
    image: "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=900&q=80",
    description: "Quiet, affectionate, and perfect for apartment life.",
    vaccinated: true,
    neutered: true,
    shelterName: "Northern Jordan Animal Care",
    tags: ["Calm", "Apartment-friendly"],
  },
];

interface AdminPetsPageProps {
  onNavigate: (page: string) => void;
}

const speciesOptions = ["Dog", "Cat", "Rabbit", "Bird", "Other"];
const statusOptions: AdminPet["status"][] = ["available", "pending", "adopted"];

export default function AdminPetsPage({ onNavigate }: AdminPetsPageProps) {
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [viewPet, setViewPet] = useState<AdminPet | null>(null);
  const [deletePet, setDeletePet] = useState<AdminPet | null>(null);
  const [page, setPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [pets, setPets] = useState<AdminPet[]>(INITIAL_PETS);
  const [newPet, setNewPet] = useState({
    name: "",
    species: "Dog",
    breed: "",
    age: "",
    gender: "Male",
    city: "",
    status: "available" as AdminPet["status"],
    description: "",
    shelterName: "",
    tags: "",
    vaccinated: true,
    neutered: false,
    image: "",
  });

  const filteredPets = useMemo(() => {
    return pets.filter((pet) => {
      const matchesSearch =
        pet.name.toLowerCase().includes(search.toLowerCase()) ||
        pet.breed.toLowerCase().includes(search.toLowerCase()) ||
        pet.city.toLowerCase().includes(search.toLowerCase());
      const matchesSpecies = speciesFilter === "all" || pet.species === speciesFilter;
      return matchesSearch && matchesSpecies;
    });
  }, [pets, search, speciesFilter]);

  function handleImageFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setNewPet((current) => ({ ...current, image: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  }

  function handleAddPet() {
    const nextPet: AdminPet = {
      id: Date.now(),
      name: newPet.name.trim(),
      species: newPet.species,
      breed: newPet.breed.trim(),
      age: newPet.age.trim(),
      gender: newPet.gender,
      city: newPet.city.trim(),
      status: newPet.status,
      image: newPet.image || "https://images.unsplash.com/photo-1543466835-00a7907e1571?auto=format&fit=crop&w=900&q=80",
      description: newPet.description.trim(),
      vaccinated: newPet.vaccinated,
      neutered: newPet.neutered,
      shelterName: newPet.shelterName.trim(),
      tags: newPet.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    };

    setPets((current) => [nextPet, ...current]);
    setNewPet({
      name: "",
      species: "Dog",
      breed: "",
      age: "",
      gender: "Male",
      city: "",
      status: "available",
      description: "",
      shelterName: "",
      tags: "",
      vaccinated: true,
      neutered: false,
      image: "",
    });
    setAddOpen(false);
  }

  return (
    <DashboardLayout role="admin" activePage="admin-pets" onNavigate={onNavigate} pageTitle="Adoptable Pets" breadcrumbs={["Admin", "Pets"]}>
      <div className="bg-white rounded-[15px] shadow-md p-5">
        <div className="flex flex-wrap gap-3 mb-5 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#089D97]" />
            <input
              placeholder="Search by name, breed, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-[10px] font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", ...speciesOptions].map((species) => (
              <button
                key={species}
                onClick={() => setSpeciesFilter(species)}
                className={`px-3 py-1.5 rounded-[20px] font-['Poppins',sans-serif] text-[12px] capitalize transition-colors ${speciesFilter === species ? "bg-[#089D97] text-white" : "bg-gray-100 text-black/70 hover:bg-gray-200"}`}
              >
                {species}
              </button>
            ))}
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-[#089D97] text-white font-['Poppins',sans-serif] font-medium text-[13px] rounded-[10px] hover:bg-[#047975] transition-colors"
          >
            <Plus size={15} /> Add Pet
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPets.map((pet) => (
            <div key={pet.id} className="rounded-[16px] border border-gray-100 overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="relative h-[220px] bg-gray-100">
                <img src={pet.image} alt={pet.name} className="h-full w-full object-cover" />
                <div className="absolute top-3 left-3">
                  <Badge label={pet.status} variant={statusBadge(pet.status)} />
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black">{pet.name}</h3>
                    <p className="font-['Poppins',sans-serif] text-[12px] text-black/55">{pet.species} · {pet.breed}</p>
                  </div>
                  <Heart size={16} className="text-[#089D97] shrink-0" />
                </div>
                <p className="font-['Poppins',sans-serif] text-[13px] text-black/70 line-clamp-2">{pet.description}</p>
                <div className="flex flex-wrap gap-2">
                  {pet.tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 rounded-full bg-[rgba(8,157,151,0.08)] text-[#047975] text-[11px] font-['Poppins',sans-serif]">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[12px] font-['Poppins',sans-serif] text-black/65">
                  <div><span className="text-black/40">Age:</span> {pet.age}</div>
                  <div><span className="text-black/40">City:</span> {pet.city}</div>
                  <div><span className="text-black/40">Shelter:</span> {pet.shelterName}</div>
                  <div><span className="text-black/40">Vaccinated:</span> {pet.vaccinated ? "Yes" : "No"}</div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setViewPet(pet)} className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-[rgba(8,157,151,0.08)] text-[#047975] font-['Poppins',sans-serif] text-[12px] hover:bg-[rgba(8,157,151,0.16)] transition-colors">
                    <Eye size={14} /> View
                  </button>
                  <button onClick={() => setDeletePet(pet)} className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-red-50 text-red-600 font-['Poppins',sans-serif] text-[12px] hover:bg-red-100 transition-colors">
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="font-['Poppins',sans-serif] text-[12px] text-black/40">{filteredPets.length} pets found</p>
          <Pagination page={page} totalPages={3} onPage={setPage} />
        </div>
      </div>

      <Modal title="Add Adoptable Pet" open={addOpen} onClose={() => setAddOpen(false)} onConfirm={handleAddPet} confirmLabel="Add Pet" size="lg">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div>
              <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">Pet Photo</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageFile(e.target.files?.[0])}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full min-h-[150px] rounded-[14px] border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 text-black/50 hover:border-[#089D97] hover:text-[#047975] transition-colors"
              >
                {newPet.image ? (
                  <img src={newPet.image} alt="Preview" className="h-[130px] w-full object-cover rounded-[12px]" />
                ) : (
                  <>
                    <Camera size={28} />
                    <span className="font-['Poppins',sans-serif] text-[12px]">Upload a photo or click to browse</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Name" value={newPet.name} onChange={(value) => setNewPet((current) => ({ ...current, name: value }))} />
              <SelectField label="Species" value={newPet.species} options={speciesOptions} onChange={(value) => setNewPet((current) => ({ ...current, species: value }))} />
              <Field label="Breed" value={newPet.breed} onChange={(value) => setNewPet((current) => ({ ...current, breed: value }))} />
              <Field label="Age" value={newPet.age} onChange={(value) => setNewPet((current) => ({ ...current, age: value }))} />
              <SelectField label="Gender" value={newPet.gender} options={["Male", "Female"]} onChange={(value) => setNewPet((current) => ({ ...current, gender: value }))} />
              <Field label="City" value={newPet.city} onChange={(value) => setNewPet((current) => ({ ...current, city: value }))} />
              <SelectField label="Status" value={newPet.status} options={statusOptions} onChange={(value) => setNewPet((current) => ({ ...current, status: value as AdminPet["status"] }))} />
              <Field label="Shelter" value={newPet.shelterName} onChange={(value) => setNewPet((current) => ({ ...current, shelterName: value }))} />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">Description</label>
              <textarea
                value={newPet.description}
                onChange={(e) => setNewPet((current) => ({ ...current, description: e.target.value }))}
                rows={5}
                className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors resize-none"
                placeholder="Add adoption details, personality notes, and care info..."
              />
            </div>

            <Field label="Tags" value={newPet.tags} onChange={(value) => setNewPet((current) => ({ ...current, tags: value }))} placeholder="Friendly, trained, family-friendly" />

            <div className="grid grid-cols-2 gap-3">
              <ToggleField label="Vaccinated" checked={newPet.vaccinated} onChange={(checked) => setNewPet((current) => ({ ...current, vaccinated: checked }))} />
              <ToggleField label="Neutered" checked={newPet.neutered} onChange={(checked) => setNewPet((current) => ({ ...current, neutered: checked }))} />
            </div>

            <div className="rounded-[14px] bg-[rgba(8,157,151,0.06)] p-4">
              <p className="font-['Poppins',sans-serif] font-semibold text-[13px] text-black mb-1">Preview</p>
              <p className="font-['Poppins',sans-serif] text-[12px] text-black/60">
                This pet will appear in the adoption listings with the picture and details you enter here.
              </p>
            </div>
          </div>
        </div>
      </Modal>

      <Modal title="Pet Details" open={!!viewPet} onClose={() => setViewPet(null)} size="md">
        {viewPet && (
          <div className="space-y-4">
            <img src={viewPet.image} alt={viewPet.name} className="w-full h-[220px] object-cover rounded-[14px]" />
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-['Poppins',sans-serif] font-semibold text-[18px] text-black">{viewPet.name}</h3>
                <p className="font-['Poppins',sans-serif] text-[13px] text-black/60">{viewPet.species} · {viewPet.breed}</p>
              </div>
              <Badge label={viewPet.status} variant={statusBadge(viewPet.status)} />
            </div>
            <p className="font-['Poppins',sans-serif] text-[13px] text-black/75">{viewPet.description}</p>
            <div className="grid grid-cols-2 gap-2 text-[13px] font-['Poppins',sans-serif] text-black/70">
              <div>Age: {viewPet.age}</div>
              <div>Gender: {viewPet.gender}</div>
              <div>City: {viewPet.city}</div>
              <div>Shelter: {viewPet.shelterName}</div>
              <div>Vaccinated: {viewPet.vaccinated ? "Yes" : "No"}</div>
              <div>Neutered: {viewPet.neutered ? "Yes" : "No"}</div>
            </div>
          </div>
        )}
      </Modal>

      <Modal title="Remove Pet" open={!!deletePet} onClose={() => setDeletePet(null)} onConfirm={() => setDeletePet(null)} confirmLabel="Remove" confirmDestructive size="sm">
        <p className="font-['Poppins',sans-serif] text-[14px] text-black">
          Remove <span className="font-semibold">{deletePet?.name}</span> from the adoption listings?
        </p>
      </Modal>
    </DashboardLayout>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{label}</label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] bg-white outline-none focus:border-[#089D97] transition-colors"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-[10px] border border-gray-200 px-3 py-2 font-['Poppins',sans-serif] text-[13px] text-black/70">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[#089D97]"
      />
    </label>
  );
}
