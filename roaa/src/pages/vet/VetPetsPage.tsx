import { useState } from "react";
import { Search, Stethoscope, Syringe } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import Badge, { statusBadge } from "../../components/Badge";
import Pagination from "../../components/Pagination";

const PETS = [
  { id: 1, name: "Max", species: "Dog", breed: "Golden Retriever", age: "2 years", gender: "Male", status: "available", lastCheckup: "2026-06-15", nextVaccine: "2026-09-15" },
  { id: 2, name: "Luna", species: "Cat", breed: "Persian", age: "1 year", gender: "Female", status: "adopted", lastCheckup: "2026-07-01", nextVaccine: "2027-01-01" },
  { id: 3, name: "Lola", species: "Rabbit", breed: "Dutch", age: "6 months", gender: "Female", status: "available", lastCheckup: "2026-05-20", nextVaccine: "2026-11-20" },
  { id: 4, name: "Shadow", species: "Cat", breed: "Chartreux", age: "5 months", gender: "Male", status: "available", lastCheckup: "2026-06-30", nextVaccine: "2026-12-30" },
];

interface VetPetsPageProps { onNavigate: (page: string, params?: Record<string, any>) => void; }

export default function VetPetsPage({ onNavigate }: VetPetsPageProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = PETS.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.breed.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout role="vet" activePage="vet-pets" onNavigate={onNavigate} pageTitle="Pets Under My Care" breadcrumbs={["Vet", "Pets"]}>
      <div className="bg-white rounded-[15px] shadow-md p-5">
        <div className="relative mb-5 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#089D97]" />
          <input placeholder="Search pets..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-[10px] font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                {["Name", "Species", "Breed", "Age", "Status", "Last Checkup", "Next Vaccine", "Actions"].map((h) => (
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
                  <td className="py-3 px-3"><Badge label={p.status} variant={statusBadge(p.status)} /></td>
                  <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/60">{p.lastCheckup}</td>
                  <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-[#089D97]">{p.nextVaccine}</td>
                  <td className="py-3 px-3">
                    <div className="flex gap-2">
                      <button onClick={() => onNavigate("vet-medical", { petId: p.id })} title="Medical" className="text-[#089D97] hover:text-[#047975] transition-colors"><Stethoscope size={15} /></button>
                      <button onClick={() => onNavigate("vet-vaccinations", { petId: p.id })} title="Vaccinations" className="text-blue-500 hover:text-blue-700 transition-colors"><Syringe size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={2} onPage={setPage} />
      </div>
    </DashboardLayout>
  );
}
