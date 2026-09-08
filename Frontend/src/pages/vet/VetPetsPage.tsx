import { useEffect, useMemo, useState } from "react";
import { Search, Stethoscope, Syringe } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import Badge, { statusBadge } from "../../components/Badge";
import EmptyState from "../../components/EmptyState";
import Pagination from "../../components/Pagination";
import { apiFetch, PetResponse } from "../../lib/api";

interface VetPetsPageProps { onNavigate: (page: string, params?: Record<string, any>) => void; }

export default function VetPetsPage({ onNavigate }: VetPetsPageProps) {
  const [pets, setPets] = useState<PetResponse[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    apiFetch<PetResponse[]>("/pets")
      .then(setPets)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load pets."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => pets.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.breed ?? "").toLowerCase().includes(search.toLowerCase()) ||
      p.species.toLowerCase().includes(search.toLowerCase())
    ),
    [pets, search],
  );

  return (
    <DashboardLayout role="vet" activePage="vet-pets" onNavigate={onNavigate} pageTitle="Pets Under My Care" breadcrumbs={["Vet", "Pets"]}>
      <div className="bg-white rounded-[15px] shadow-md p-5">
        <div className="relative mb-5 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#089D97]" />
          <input placeholder="Search pets..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-[10px] font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
        </div>
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((n) => <div key={n} className="h-[58px] rounded-[10px] bg-gray-50 animate-pulse" />)}</div>
        ) : error ? (
          <EmptyState icon={<Stethoscope size={28} />} title="Unable to load pets" description={error} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Stethoscope size={28} />} title="No pets found" description="No pets match your search." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Name", "Species", "Breed", "Age", "Status", "Health", "Actions"].map((h) => (
                    <th key={h} className="py-2.5 px-3 font-['Poppins',sans-serif] font-semibold text-[11px] text-black/50 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.petId} className="border-b border-gray-50 hover:bg-[rgba(8,157,151,0.03)] transition-colors">
                    <td className="py-3 px-3 font-['Poppins',sans-serif] font-medium text-[14px] text-black">{p.name}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{p.species}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{p.breed ?? "-"}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{p.age == null ? "-" : `${p.age} years`}</td>
                    <td className="py-3 px-3"><Badge label={p.adoptionStatus.toLowerCase()} variant={statusBadge(p.adoptionStatus.toLowerCase())} /></td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/60">{p.healthStatus ?? "-"}</td>
                    <td className="py-3 px-3">
                      <div className="flex gap-2">
                        <button onClick={() => onNavigate("vet-medical", { petId: p.petId })} title="Medical" className="text-[#089D97] hover:text-[#047975] transition-colors"><Stethoscope size={15} /></button>
                        <button onClick={() => onNavigate("vet-vaccinations", { petId: p.petId })} title="Vaccinations" className="text-blue-500 hover:text-blue-700 transition-colors"><Syringe size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} totalPages={Math.max(1, Math.ceil(filtered.length / 10))} onPage={setPage} />
      </div>
    </DashboardLayout>
  );
}
