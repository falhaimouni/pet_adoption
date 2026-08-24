import { useState } from "react";
import {
  ArrowLeft, Phone, MapPin, CheckCircle, XCircle,
  Star, Users, PawPrint, ChevronLeft, ChevronRight, Share2
} from "lucide-react";
import Navbar from "../components/Navbar";
import PetCard from "../components/PetCard";
import { PETS } from "../data/pets";
import { useLanguage } from "../context/LanguageContext";

interface PetDetailPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
  petId?: number;
}

const MOCK_REVIEWS = [
  { id: 1, name: "Hana Khalil", rating: 5, date: "Jul 10, 2026", text: "I adopted from Petopia last year — the process was smooth, the staff were caring, and my dog is the best thing that ever happened to me." },
  { id: 2, name: "Omar Saleh", rating: 5, date: "Jun 22, 2026", text: "The shelter is clean, the animals are well-cared-for, and the team genuinely cares about finding the right match. Highly recommend." },
  { id: 3, name: "Lara Mansour", rating: 4, date: "Jun 5, 2026", text: "Lovely experience overall. My cat has settled in perfectly. The follow-up care support was a nice touch." },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={14} className={s <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"} />
      ))}
    </div>
  );
}

export default function PetDetailPage({ onNavigate, petId }: PetDetailPageProps) {
  const pet = PETS.find((p) => p.id === petId) ?? PETS[0];
  const { t } = useLanguage();
  const [adoptOpen, setAdoptOpen] = useState(false);
  const [adoptDone, setAdoptDone] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [imgIdx, setImgIdx] = useState(0);

  const similarPets = PETS.filter((p) => p.id !== pet.id && (p.species === pet.species || p.city === pet.city)).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#f0f8f7]">
      <Navbar onNavigate={onNavigate} />

      <div className="max-w-5xl mx-auto px-5 pt-6 pb-16">
        {/* Back */}
        <button
          onClick={() => onNavigate("pets")}
          className="flex items-center gap-2 font-['Poppins',sans-serif] text-[13px] text-[#5a8a87] hover:text-[#089D97] mb-6 group transition-colors"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> {t("pet_back")}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Left — image + shelter */}
          <div className="flex flex-col gap-4">
            {/* Main image */}
            <div className="relative bg-white rounded-[24px] shadow-sm overflow-hidden aspect-[4/3] flex items-center justify-center">
              <img
                src={pet.image}
                alt={pet.name}
                className="w-full h-full object-contain transition-opacity duration-300"
              />
              <span className={`absolute top-4 left-4 px-3 py-1 rounded-full font-['Poppins',sans-serif] text-[12px] font-semibold capitalize ${pet.status === "available" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {pet.status}
              </span>
            </div>

            {/* Tags */}
            <div className="flex gap-2 flex-wrap">
              {pet.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 bg-white rounded-full font-['Poppins',sans-serif] text-[12px] text-[#089D97] border border-[rgba(8,157,151,0.25)] shadow-sm">
                  {tag}
                </span>
              ))}
            </div>

            {/* Shelter card */}
            <div className="bg-white rounded-[20px] shadow-sm p-5">
              <h3 className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#1a2e2d] mb-3">{t("pet_shelter_info")}</h3>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#e0f2f0] flex items-center justify-center shrink-0">
                  <PawPrint size={18} className="text-[#089D97]" />
                </div>
                <div className="flex-1">
                  <p className="font-['Poppins',sans-serif] font-medium text-[14px] text-[#1a2e2d]">{pet.shelterName}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin size={12} className="text-[#089D97]" />
                    <span className="font-['Poppins',sans-serif] text-[12px] text-[#5a8a87]">{pet.location}</span>
                  </div>
                </div>
              </div>
              <a
                href={`tel:${pet.shelterPhone}`}
                className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 border-2 border-[#089D97] text-[#089D97] font-['Poppins',sans-serif] font-medium text-[13px] rounded-[12px] hover:bg-[#089D97] hover:text-white transition-all"
              >
                <Phone size={14} /> {pet.shelterPhone}
              </a>
            </div>
          </div>

          {/* Right — details */}
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex items-start justify-between gap-2">
                <h1 className="font-['Prata',serif] text-[36px] text-[#1a2e2d] leading-tight">{pet.name}</h1>
                <button className="mt-1 w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-[#089D97] hover:bg-[#e0f2f0] transition-colors">
                  <Share2 size={16} />
                </button>
              </div>
              <p className="font-['Poppins',sans-serif] text-[16px] text-[#5a8a87] mt-1">{pet.breed}</p>
              <div className="flex items-center gap-3 mt-2">
                <StarRating rating={Math.round(pet.rating)} />
                <span className="font-['Poppins',sans-serif] text-[13px] text-[#5a8a87]">{pet.rating} · {pet.reviewCount} reviews</span>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: t("pet_stat_age"), value: pet.age },
                { label: t("pet_stat_gender"), value: pet.gender },
                { label: t("pet_stat_size"), value: pet.size },
                { label: t("pet_stat_weight"), value: pet.weight },
                { label: t("pet_stat_color"), value: pet.color },
                { label: t("pet_stat_health"), value: pet.healthStatus },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white rounded-[14px] p-3 shadow-sm">
                  <p className="font-['Poppins',sans-serif] text-[10px] text-[#5a8a87] uppercase tracking-wider">{label}</p>
                  <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#1a2e2d] mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="bg-white rounded-[20px] p-5 shadow-sm">
              <h3 className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#089D97] uppercase tracking-wider mb-2">{t("pet_about")} {pet.name}</h3>
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#1a2e2d]/80 leading-relaxed">{pet.description}</p>
            </div>

            {/* Personality */}
            <div>
              <h3 className="font-['Poppins',sans-serif] font-semibold text-[13px] text-[#5a8a87] uppercase tracking-wider mb-2">{t("pet_personality")}</h3>
              <div className="flex gap-2 flex-wrap">
                {pet.personality.map((trait) => (
                  <span key={trait} className="px-3 py-1.5 bg-[#e0f2f0] text-[#047975] font-['Poppins',sans-serif] text-[13px] font-medium rounded-full">
                    {trait}
                  </span>
                ))}
              </div>
            </div>

            {/* Health + compatibility */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: t("pet_vaccinated"), val: pet.vaccinated },
                { label: t("pet_neutered"), val: pet.neutered },
                { label: t("pet_good_kids"), val: pet.goodWithKids },
                { label: t("pet_good_pets"), val: pet.goodWithPets },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center gap-2 bg-white rounded-[12px] p-3 shadow-sm">
                  {val ? <CheckCircle size={15} className="text-emerald-500 shrink-0" /> : <XCircle size={15} className="text-gray-300 shrink-0" />}
                  <span className={`font-['Poppins',sans-serif] text-[13px] ${val ? "text-[#1a2e2d]" : "text-gray-400"}`}>{label}</span>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            {pet.status === "available" ? (
              <div className="flex gap-3">
                <button
                  onClick={() => { setAdoptOpen(true); setAdoptDone(false); }}
                  className="flex-1 py-3.5 bg-[#089D97] text-white font-['Poppins',sans-serif] font-semibold text-[15px] rounded-[14px] hover:bg-[#047975] transition-colors shadow-md"
                >
                  🐾 {t("pet_adopt_btn")} {pet.name}
                </button>
              </div>
            ) : (
              <div className="py-3.5 bg-amber-50 border-2 border-amber-200 text-amber-700 font-['Poppins',sans-serif] font-semibold text-[15px] rounded-[14px] text-center">
                {t("pet_adoption_pending")}
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-['Prata',serif] text-[26px] text-[#1a2e2d]">{t("pet_reviews_title")}</h2>
            <div className="flex items-center gap-2">
              <StarRating rating={5} />
              <span className="font-['Poppins',sans-serif] font-semibold text-[16px] text-[#1a2e2d]">{pet.rating}</span>
              <span className="font-['Poppins',sans-serif] text-[13px] text-[#5a8a87]">({pet.reviewCount} {t("pet_reviews")})</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MOCK_REVIEWS.map((r) => (
              <div key={r.id} className="bg-white rounded-[20px] shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#e0f2f0] flex items-center justify-center font-['Poppins',sans-serif] font-bold text-[13px] text-[#089D97]">
                      {r.name[0]}
                    </div>
                    <div>
                      <p className="font-['Poppins',sans-serif] font-medium text-[13px] text-[#1a2e2d]">{r.name}</p>
                      <p className="font-['Poppins',sans-serif] text-[11px] text-[#5a8a87]">{r.date}</p>
                    </div>
                  </div>
                  <StarRating rating={r.rating} />
                </div>
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#1a2e2d]/70 leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Similar pets */}
        {similarPets.length > 0 && (
          <section>
            <h2 className="font-['Prata',serif] text-[26px] text-[#1a2e2d] mb-5">{t("pet_similar")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {similarPets.map((p) => (
                <PetCard
                  key={p.id}
                  pet={p}
                  onViewDetails={(id) => onNavigate("pet-detail", { petId: id })}
                  onAdopt={(id) => onNavigate("pet-detail", { petId: id })}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Adopt modal */}
      {adoptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40" onClick={() => setAdoptOpen(false)}>
          <div className="bg-white rounded-[24px] shadow-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            {adoptDone ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">🎉</div>
                <h3 className="font-['Poppins',sans-serif] font-semibold text-[22px] text-[#1a2e2d] mb-1">{t("pet_sent_title")}</h3>
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#5a8a87]">{t("pet_sent_desc")}</p>
                <button onClick={() => setAdoptOpen(false)} className="mt-6 px-8 py-2.5 bg-[#089D97] text-white font-['Poppins',sans-serif] font-semibold rounded-[12px] hover:bg-[#047975] transition-colors">
                  {t("pet_done")}
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-['Poppins',sans-serif] font-semibold text-[20px] text-[#1a2e2d] mb-1">{t("pet_adopt_btn")} {pet.name}</h3>
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#5a8a87] mb-5">{t("pet_adopt_modal_sub")}</p>
                <div className="space-y-4">
                  {[{ label: t("pet_your_name"), field: "name" as const, placeholder: t("pet_full_name_ph") }, { label: t("pet_phone"), field: "phone" as const, placeholder: "+962-xx-xxxxxxx" }].map(({ label, field, placeholder }) => (
                    <div key={field}>
                      <label className="block font-['Poppins',sans-serif] text-[12px] text-[#5a8a87] mb-1">{label}</label>
                      <input value={form[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} placeholder={placeholder} className="w-full border border-gray-200 rounded-[12px] px-4 py-2.5 font-['Poppins',sans-serif] text-[14px] outline-none focus:border-[#089D97] focus:ring-1 focus:ring-[#089D97]/20 transition-all" />
                    </div>
                  ))}
                  <div>
                    <label className="block font-['Poppins',sans-serif] text-[12px] text-[#5a8a87] mb-1">{t("pet_home_desc")}</label>
                    <textarea value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} rows={3} placeholder={t("pet_garden_ph")} className="w-full border border-gray-200 rounded-[12px] px-4 py-2.5 font-['Poppins',sans-serif] text-[14px] outline-none focus:border-[#089D97] focus:ring-1 focus:ring-[#089D97]/20 transition-all resize-none" />
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setAdoptOpen(false)} className="flex-1 py-2.5 border-2 border-gray-200 text-[#5a8a87] font-['Poppins',sans-serif] font-medium text-[14px] rounded-[12px] hover:border-gray-300 transition-colors">{t("pet_cancel")}</button>
                  <button onClick={() => setAdoptDone(true)} className="flex-1 py-2.5 bg-[#089D97] text-white font-['Poppins',sans-serif] font-semibold text-[14px] rounded-[12px] hover:bg-[#047975] transition-colors">{t("pet_submit")}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
