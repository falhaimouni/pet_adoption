import { useState } from "react";
import { Search } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import Badge, { statusBadge } from "../../components/Badge";
import Pagination from "../../components/Pagination";

const ADOPTIONS = [
  { id: 1, adopter: "Roaa A.", pet: "Max", species: "Dog", date: "2025-11-10", status: "active" },
  { id: 2, adopter: "Ali M.", pet: "Luna", species: "Cat", date: "2026-01-22", status: "active" },
  { id: 3, adopter: "Hana J.", pet: "Buddy", species: "Dog", date: "2024-08-05", status: "active" },
  { id: 4, adopter: "Rami S.", pet: "Cleo", species: "Cat", date: "2023-12-01", status: "active" },
];

interface StaffAdoptionsPageProps { onNavigate: (page: string) => void; }

export default function StaffAdoptionsPage({ onNavigate }: StaffAdoptionsPageProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = ADOPTIONS.filter((a) =>
    a.adopter.toLowerCase().includes(search.toLowerCase()) || a.pet.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout role="staff" activePage="staff-adoptions" onNavigate={onNavigate} pageTitle="Adoptions" breadcrumbs={["Staff", "Adoptions"]}>
      <div className="bg-white rounded-[15px] shadow-md p-5">
        <div className="relative mb-5 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#089D97]" />
          <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-[10px] font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                {["Adopter", "Pet", "Species", "Adoption Date", "Status"].map((h) => (
                  <th key={h} className="py-2.5 px-3 font-['Poppins',sans-serif] font-semibold text-[11px] text-black/50 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-gray-50 hover:bg-[rgba(8,157,151,0.03)] transition-colors">
                  <td className="py-3 px-3 font-['Poppins',sans-serif] font-medium text-[14px] text-black">{a.adopter}</td>
                  <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{a.pet}</td>
                  <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{a.species}</td>
                  <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/60">{a.date}</td>
                  <td className="py-3 px-3"><Badge label={a.status} variant={statusBadge(a.status)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={3} onPage={setPage} />
      </div>
    </DashboardLayout>
  );
}
