import { Heart } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import { useLanguage } from "../../context/LanguageContext";
import Badge, { statusBadge } from "../../components/Badge";
import EmptyState from "../../components/EmptyState";
import goldenImg from "../../imports/MyPetopia/6873b1dc8519e91f8d65e08b4fbf144707066349.png";
import catImg from "../../imports/MyPetopia/d297332b2c72bbab968e9869ca23efc085706d7b.png";

const adoptions = [
  { id: 1, pet: "Max", species: "Golden Retriever", adoptedAt: "2025-11-10", status: "active", image: goldenImg, age: "2 years", gender: "Male" },
  { id: 2, pet: "Luna", species: "Persian Cat", adoptedAt: "2026-01-22", status: "active", image: catImg, age: "1 year", gender: "Female" },
];

interface MyAdoptionsPageProps { onNavigate: (page: string) => void; }

export default function MyAdoptionsPage({ onNavigate }: MyAdoptionsPageProps) {
  const { t } = useLanguage();
  return (
    <DashboardLayout role="adopter" activePage="my-adoptions" onNavigate={onNavigate} pageTitle="My Adoptions" breadcrumbs={["My Petopia", "My Adoptions"]}>
      {adoptions.length === 0 ? (
        <div className="bg-white rounded-[15px] shadow-md p-5">
          <EmptyState icon={<Heart size={28} />} title={t("adoptions_no_yet")} description={t("adoptions_no_yet_desc")} action={{ label: t("adoptions_browse"), onClick: () => onNavigate("pets") }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {adoptions.map((a) => (
            <div key={a.id} className="bg-white rounded-[15px] shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="bg-[rgba(8,157,151,0.08)] h-[180px] flex items-center justify-center overflow-hidden">
                <img src={a.image} alt={a.pet} className="h-full w-full object-contain" />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-['Poppins',sans-serif] font-semibold text-[18px] text-black">{a.pet}</h3>
                  <Badge label={a.status} variant={statusBadge(a.status)} />
                </div>
                <p className="font-['Poppins',sans-serif] text-[13px] text-black/60 mb-1">{a.species}</p>
                <div className="flex gap-4 text-[12px] font-['Poppins',sans-serif] text-black/60 mt-2">
                  <span>{a.gender}</span>
                  <span>•</span>
                  <span>{a.age}</span>
                </div>
                <p className="font-['Poppins',sans-serif] text-[12px] text-[#089D97] mt-3">{t("adoptions_adopted_on")} {a.adoptedAt}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
