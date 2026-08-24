import { useState } from "react";
import { Search, Plus, Edit, Trash2, Eye } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import Badge, { statusBadge } from "../../components/Badge";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";

interface Pet {
  id: number; name: string; species: string; breed: string; age: string; gender: string; status: string; location: string;
}

const PETS: Pet[] = [
  { id: 1, name: "Max", species: "Dog", breed: "Golden Retriever", age: "2 years", gender: "Male", status: "available", location: "Amman" },
  { id: 2, name: "Luna", species: "Cat", breed: "Persian", age: "1 year", gender: "Female", status: "adopted", location: "Irbid" },
  { id: 3, name: "Lola", species: "Rabbit", breed: "Dutch", age: "6 months", gender: "Female", status: "available", location: "Amman" },
  { id: 4, name: "Daisy", species: "Dog", breed: "Poodle", age: "2 months", gender: "Female", status: "pending", location: "Amman" },
  { id: 5, name: "Shadow", species: "Cat", breed: "Chartreux", age: "5 months", gender: "Male", status: "available", location: "Amman" },
  { id: 6, name: "Buddy", species: "Dog", breed: "Labrador", age: "3 years", gender: "Male", status: "available", location: "Zarqa" },
];

interface StaffPetsPageProps { onNavigate: (page: string) => void; }

export default function StaffPetsPage({ onNavigate }: StaffPetsPageProps) {
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [deletePet, setDeletePet] = useState<Pet | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [newPet, setNewPet] = useState({ name: "", species: "Dog", breed: "", age: "", gender: "Male", location: "" });

  const filtered = PETS.filter((p) => {
    const ms = p.name.toLowerCase().includes(search.toLowerCase()) || p.breed.toLowerCase().includes(search.toLowerCase());
    const mf = speciesFilter === "all" || p.species === speciesFilter;
    return ms && mf;
  });

  return (
    <DashboardLayout role="staff" activePage="staff-pets" onNavigate={onNavigate} pageTitle="Manage Pets" breadcrumbs={["Staff", "Pets"]}>
      <div className="bg-white rounded-[15px] shadow-md p-5">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 mb-5 items-center">
          <div className="flex-1 min-w-[180px] relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#089D97]" />
            <input placeholder="Search pets..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-[10px] font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", "Dog", "Cat", "Rabbit", "Bird"].map((s) => (
              <button key={s} onClick={() => setSpeciesFilter(s)} className={`px-3 py-1.5 rounded-[20px] font-['Poppins',sans-serif] text-[12px] transition-colors ${speciesFilter === s ? "bg-[#089D97] text-white" : "bg-gray-100 text-black/70 hover:bg-gray-200"}`}>{s}</button>
            ))}
          </div>
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#089D97] text-white font-['Poppins',sans-serif] font-medium text-[13px] rounded-[10px] hover:bg-[#047975] transition-colors ml-auto">
            <Plus size={16} /> Add Pet
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                {["Name", "Species", "Breed", "Age", "Gender", "Location", "Status", "Actions"].map((h) => (
                  <th key={h} className="py-2.5 px-3 font-['Poppins',sans-serif] font-semibold text-[11px] text-black/50 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-[rgba(8,157,151,0.03)] transition-colors">
                  <td className="py-3 px-3 font-['Poppins',sans-serif] font-medium text-[14px] text-black">{p.name}</td>
                  <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{p.species}</td>
                  <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{p.breed}</td>
                  <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{p.age}</td>
                  <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{p.gender}</td>
                  <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{p.location}</td>
                  <td className="py-3 px-3"><Badge label={p.status} variant={statusBadge(p.status)} /></td>
                  <td className="py-3 px-3">
                    <div className="flex gap-2">
                      <button className="text-[#089D97] hover:text-[#047975] transition-colors"><Eye size={15} /></button>
                      <button className="text-blue-500 hover:text-blue-700 transition-colors"><Edit size={15} /></button>
                      <button onClick={() => setDeletePet(p)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={4} onPage={setPage} />
      </div>

      {/* Add modal */}
      <Modal title="Add New Pet" open={addOpen} onClose={() => setAddOpen(false)} onConfirm={() => setAddOpen(false)} confirmLabel="Add Pet" size="md">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Name", field: "name" as const },
            { label: "Breed", field: "breed" as const },
            { label: "Age", field: "age" as const },
            { label: "Location", field: "location" as const },
          ].map(({ label, field }) => (
            <div key={field}>
              <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{label}</label>
              <input value={newPet[field]} onChange={(e) => setNewPet((p) => ({ ...p, [field]: e.target.value }))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
            </div>
          ))}
          <div>
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">Species</label>
            <select value={newPet.species} onChange={(e) => setNewPet((p) => ({ ...p, species: e.target.value }))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors bg-white">
              {["Dog", "Cat", "Rabbit", "Bird", "Other"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">Gender</label>
            <select value={newPet.gender} onChange={(e) => setNewPet((p) => ({ ...p, gender: e.target.value }))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors bg-white">
              <option>Male</option><option>Female</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal title="Remove Pet" open={!!deletePet} onClose={() => setDeletePet(null)} onConfirm={() => setDeletePet(null)} confirmLabel="Yes, Remove" confirmDestructive size="sm">
        <p className="font-['Poppins',sans-serif] text-[14px] text-black">Are you sure you want to remove <span className="font-semibold">{deletePet?.name}</span> from the listings?</p>
      </Modal>
    </DashboardLayout>
  );
}
