import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { PetResponse } from "../lib/api";
import { useLanguage } from "../context/LanguageContext";
import { defaultPetImage, getPrimaryPetImageUrl } from "../lib/petImages";
import AuthenticatedImage from "./AuthenticatedImage";

interface PetCardProps {
  pet: PetResponse;
  onViewDetails: (petId: string) => void;
  onAdopt: (petId: string) => void;
}

const STATUS_STYLES: Record<string, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  ADOPTED: "bg-gray-100 text-gray-500",
  MEDICAL_HOLD: "bg-sky-100 text-sky-700",
};

const SPECIES_COLORS: Record<string, string> = {
  Dog: "bg-orange-100 text-orange-700",
  Cat: "bg-purple-100 text-purple-700",
  Rabbit: "bg-pink-100 text-pink-700",
  Bird: "bg-sky-100 text-sky-700",
  default: "bg-teal-100 text-teal-700",
};

export default function PetCard({ pet, onViewDetails, onAdopt }: PetCardProps) {
  const { t } = useLanguage();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const speciesColor = SPECIES_COLORS[pet.species] ?? SPECIES_COLORS.default;
  const status = pet.adoptionStatus.toUpperCase();
  const imageUrl = getPrimaryPetImageUrl(pet.images);
  const formattedAge = pet.age == null ? t("common_unknown") : `${pet.age} ${pet.age === 1 ? t("common_year") : t("common_years")}`;
  const statusText =
    status === "AVAILABLE" ? t("status_available") :
    status === "PENDING" ? t("status_pending") :
    status === "ADOPTED" ? t("status_adopted") :
    t("common_unavailable");

  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [pet.petId, imageUrl]);

  return (
    <article className="self-start bg-white rounded-[22px] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group border border-transparent hover:border-[rgba(8,157,151,0.12)] flex flex-col">
      {/* Image */}
      <div className="relative w-full overflow-hidden flex-shrink-0">
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-secondary via-[#f0f9f8] to-secondary bg-[length:200%_100%]" />
        )}
        <AuthenticatedImage
          src={imgError ? defaultPetImage : imageUrl}
          fallback={defaultPetImage}
          alt={pet.name}
          onLoad={() => setImgLoaded(true)}
          onError={() => { setImgLoaded(true); setImgError(true); }}
          className={`block w-full h-auto transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
        />

        {/* Species pill — top-left */}
        <span className={`absolute top-3 start-3 px-2.5 py-0.5 rounded-full font-['Poppins',sans-serif] text-[11px] font-semibold ${speciesColor}`}>
          {t(`species_${pet.species.toLowerCase()}`)}
        </span>

        {/* Status badge — top-right */}
        <span className={`absolute top-3 end-3 px-2.5 py-0.5 rounded-full font-['Poppins',sans-serif] text-[10px] font-semibold capitalize ${STATUS_STYLES[status] ?? STATUS_STYLES.AVAILABLE}`}>
          {statusText}
        </span>
      </div>

      {/* Content */}
      <div className="bg-white px-4 pb-4 pt-3 flex flex-col gap-3">
        {/* Name + breed */}
        <div>
          <h3 className="font-['Poppins',sans-serif] font-semibold text-[17px] text-foreground leading-tight">{pet.name}</h3>
          <p className="font-['Poppins',sans-serif] text-[12px] text-[#5a8a87] mt-0.5">{pet.breed || t("common_mixed_breed")}</p>
        </div>

        {/* Details row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: t("pet_stat_age"), value: pet.age },
            { label: t("pet_stat_gender"), value: pet.gender || t("common_unknown") },
            { label: t("pet_stat_health"), value: pet.healthStatus || t("common_unknown") },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#f0f9f8] rounded-[10px] py-1.5 px-1">
              <p className="font-['Poppins',sans-serif] text-[10px] text-[#5a8a87]">{label}</p>
              <p className="font-['Poppins',sans-serif] text-[12px] font-semibold text-foreground truncate">{label === t("pet_stat_age") ? formattedAge : value}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-1">
          <button
            onClick={() => onViewDetails(pet.petId)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 border-2 border-primary text-primary font-['Poppins',sans-serif] font-medium text-[13px] rounded-[11px] hover:bg-primary hover:text-white transition-all duration-200"
          >
            <Eye size={13} /> {t("pet_details_btn")}
          </button>
          <button
            onClick={() => onAdopt(pet.petId)}
            disabled={status !== "AVAILABLE"}
            className="flex-1 py-2 bg-primary text-white font-['Poppins',sans-serif] font-medium text-[13px] rounded-[11px] hover:bg-primary-hover transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {status === "AVAILABLE" ? t("pet_adopt_btn") : statusText}
          </button>
        </div>
      </div>
    </article>
  );
}
