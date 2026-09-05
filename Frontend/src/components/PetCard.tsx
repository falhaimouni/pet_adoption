import { useState } from "react";
import { Eye, Heart, PawPrint } from "lucide-react";
import { PetResponse, resolveAssetUrl } from "../lib/api";
import { useLanguage } from "../context/LanguageContext";
import { useWishlist } from "../context/WishlistContext";

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
  const { isPetSaved, togglePet } = useWishlist();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const speciesColor = SPECIES_COLORS[pet.species] ?? SPECIES_COLORS.default;
  const status = pet.adoptionStatus.toUpperCase();
  const imageUrl = resolveAssetUrl(pet.images?.[0]?.imageUrl);
  const formattedAge = pet.age == null ? t("common_unknown") : `${pet.age} ${pet.age === 1 ? t("common_year") : t("common_years")}`;
  const statusText =
    status === "AVAILABLE" ? t("status_available") :
    status === "PENDING" ? t("status_pending") :
    status === "ADOPTED" ? t("status_adopted") :
    t("common_unavailable");
  const saved = isPetSaved(pet.petId);

  return (
    <article className="bg-white rounded-[22px] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group border border-transparent hover:border-[rgba(8,157,151,0.12)] flex flex-col">
      {/* Image */}
      <div className="relative h-[210px] bg-[#e8f5f4] overflow-hidden flex-shrink-0">
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-[#e0f2f0] via-[#f0f9f8] to-[#e0f2f0] bg-[length:200%_100%]" />
        )}
        {imgError || !imageUrl ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#089D97]/40">
            <PawPrint size={36} />
            <span className="font-['Poppins',sans-serif] text-[12px]">{t("common_no_image")}</span>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={pet.name}
            onLoad={() => setImgLoaded(true)}
            onError={() => { setImgLoaded(true); setImgError(true); }}
            className={`w-full h-full object-contain transition-transform duration-500 group-hover:scale-110 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          />
        )}

        {/* Species pill — top-left */}
        <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full font-['Poppins',sans-serif] text-[11px] font-semibold ${speciesColor}`}>
          {pet.species}
        </span>

        {/* Status badge — top-right */}
        <span className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full font-['Poppins',sans-serif] text-[10px] font-semibold capitalize ${STATUS_STYLES[status] ?? STATUS_STYLES.AVAILABLE}`}>
          {statusText}
        </span>
        <button
          type="button"
          onClick={() => togglePet(pet)}
          aria-label={saved ? "Remove from wishlist" : "Save pet"}
          className={`absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-colors ${saved ? "bg-rose-500 text-white" : "bg-white text-[#089D97] hover:bg-rose-50 hover:text-rose-500"}`}
        >
          <Heart size={16} className={saved ? "fill-white" : ""} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Name + breed */}
        <div>
          <h3 className="font-['Poppins',sans-serif] font-semibold text-[17px] text-[#1a2e2d] leading-tight">{pet.name}</h3>
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
              <p className="font-['Poppins',sans-serif] text-[12px] font-semibold text-[#1a2e2d] truncate">{label === t("pet_stat_age") ? formattedAge : value}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-1">
          <button
            onClick={() => onViewDetails(pet.petId)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 border-2 border-[#089D97] text-[#089D97] font-['Poppins',sans-serif] font-medium text-[13px] rounded-[11px] hover:bg-[#089D97] hover:text-white transition-all duration-200"
          >
            <Eye size={13} /> {t("pet_details_btn")}
          </button>
          <button
            onClick={() => onAdopt(pet.petId)}
            disabled={status !== "AVAILABLE"}
            className="flex-1 py-2 bg-[#089D97] text-white font-['Poppins',sans-serif] font-medium text-[13px] rounded-[11px] hover:bg-[#047975] transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {status === "AVAILABLE" ? t("pet_adopt_btn") : statusText}
          </button>
        </div>
      </div>
    </article>
  );
}
