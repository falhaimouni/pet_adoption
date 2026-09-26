import { useText } from "../../i18n/useText";
import { useEffect, useState } from "react";
import { Heart, PawPrint } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import { useLanguage } from "../../context/LanguageContext";
import EmptyState from "../../components/EmptyState";
import { apiFetch } from "../../lib/api";

interface Adoption {
  adoptionId: string;
  adoptionDate: string;
  pet: { petId: string; name: string; species: string; adoptionStatus: string };
}

interface MyAdoptionsPageProps { onNavigate: (page: string) => void; }

export default function MyAdoptionsPage({ onNavigate }: MyAdoptionsPageProps) {
  const tx = useText();
  const { t } = useLanguage();
  const [adoptions, setAdoptions] = useState<Adoption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    apiFetch<Adoption[]>("/adoption/adoptions")
      .then(setAdoptions)
      .catch((err) => setError(err instanceof Error ? err.message : tx("Unable to load adoptions.")))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout role="adopter" activePage="my-adoptions" onNavigate={onNavigate} pageTitle={tx("My Adoptions")} breadcrumbs={["My Petopia", "My Adoptions"]}>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => <div key={n} className="h-[240px] rounded-[15px] bg-white animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="bg-white rounded-[15px] shadow-md p-5">
          <EmptyState icon={<Heart size={28} />} title={t("adoptions_load_error")} description={error} />
        </div>
      ) : adoptions.length === 0 ? (
        <div className="bg-white rounded-[15px] shadow-md p-5">
          <EmptyState icon={<Heart size={28} />} title={t("adoptions_no_yet")} description={t("adoptions_no_yet_desc")} action={{ label: t("adoptions_browse"), onClick: () => onNavigate("pets") }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {adoptions.map((a) => (
            <div key={a.adoptionId} className="bg-white rounded-[15px] shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="bg-[rgba(8,157,151,0.08)] h-[150px] flex items-center justify-center">
                <PawPrint size={48} className="text-[#089D97]/45" />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-['Poppins',sans-serif] font-semibold text-[18px] text-black">{a.pet.name}</h3>
                </div>
                <p className="font-['Poppins',sans-serif] text-[13px] text-black/60 mb-1">{tx(a.pet.species)}</p>
                <p className="font-['Poppins',sans-serif] text-[12px] text-[#089D97] mt-3">{t("adoptions_adopted_on")} {a.adoptionDate}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
