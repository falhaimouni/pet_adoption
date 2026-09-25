import { useText } from "../../i18n/useText";
import { useEffect, useMemo, useState } from "react";
import { Heart, Search } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import Badge, { statusBadge } from "../../components/Badge";
import EmptyState from "../../components/EmptyState";
import { apiFetch } from "../../lib/api";
import type { UserRole } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

interface Adoption {
  adoptionId: string;
  adoptionDate: string;
  contractStatus: string;
  adopter: { firstName: string; lastName: string };
  pet: { name: string; species: string; adoptionStatus: string };
}

interface StaffAdoptionsPageProps { onNavigate: (page: string) => void; role?: UserRole; activePage?: string; }

export default function StaffAdoptionsPage({ onNavigate, role = "employee", activePage = "staff-adoptions" }: StaffAdoptionsPageProps) {
  const tx = useText();
  const { t } = useLanguage();
  const [items, setItems] = useState<Adoption[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    apiFetch<Adoption[]>("/adoption/adoptions")
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : t("adoptions_load_error")))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => items.filter((a) => {
    const adopter = `${a.adopter.firstName} ${a.adopter.lastName}`.toLowerCase();
    return adopter.includes(search.toLowerCase()) || a.pet.name.toLowerCase().includes(search.toLowerCase());
  }), [items, search]);

  return (
    <DashboardLayout role={role} activePage={activePage} onNavigate={onNavigate} pageTitle={t("nav_adoptions")} breadcrumbs={[t(`role_${role}`), t("nav_adoptions")]}>
      <div className="bg-white rounded-[15px] shadow-md p-5">
        <div className="relative mb-5 max-w-xs">
          <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-[#089D97]" />
          <input placeholder={t("common_search")} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full ps-8 pe-3 py-2 border border-gray-200 rounded-[10px] font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
        </div>
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((n) => <div key={n} className="h-[58px] rounded-[10px] bg-gray-50 animate-pulse" />)}</div>
        ) : error ? (
          <EmptyState icon={<Heart size={28} />} title={t("adoptions_load_error")} description={error} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Heart size={28} />} title={t("adoptions_empty_title")} description={t("adoptions_empty_desc")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead>
                <tr className="border-b border-gray-100">
                  {[t("th_adopter"), t("th_pet"), t("th_species"), t("th_adoption_date"), t("adoptions_contract")].map((h) => <th key={h} className="py-2.5 px-3 font-['Poppins',sans-serif] font-semibold text-[11px] text-black/50 uppercase tracking-wider whitespace-nowrap">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.adoptionId} className="border-b border-gray-50 hover:bg-[rgba(8,157,151,0.03)] transition-colors">
                    <td className="py-3 px-3 font-['Poppins',sans-serif] font-medium text-[14px] text-black">{a.adopter.firstName} {a.adopter.lastName}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{a.pet.name}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70">{tx(a.pet.species)}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/60">{a.adoptionDate}</td>
                    <td className="py-3 px-3"><Badge label={a.contractStatus.toLowerCase()} variant={statusBadge(a.contractStatus.toLowerCase())} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
