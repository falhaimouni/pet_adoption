import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, X, ChevronDown, ChevronUp, PawPrint } from "lucide-react";
import Navbar from "../components/Navbar";
import PetCard from "../components/PetCard";
import EmptyState from "../components/EmptyState";
import { PETS, PET_CITIES, Pet } from "../data/pets";
import { useLanguage } from "../context/LanguageContext";

// Re-export for backward compat
export type { Pet };
export const PETS_DATA = PETS;

const SPECIES_ICONS: Record<string, string> = {
  Dog: "🐶",
  Cat: "🐱",
  Rabbit: "🐰",
  Bird: "🐦",
  Fish: "🐠",
  Hamster: "🐹",
  Turtle: "🐢",
};

const ALL_SPECIES = ["Dog", "Cat", "Rabbit", "Bird", "Fish", "Hamster", "Turtle"];

const SPECIES_KEY: Record<string, string> = {
  Dog: "species_dog", Cat: "species_cat", Rabbit: "species_rabbit",
  Bird: "species_bird", Fish: "species_fish", Hamster: "species_hamster", Turtle: "species_turtle",
};
const SPECIES_KEY_PL: Record<string, string> = {
  Dog: "species_dogs", Cat: "species_cats", Rabbit: "species_rabbits",
  Bird: "species_birds", Fish: "species_fish_pl", Hamster: "species_hamsters", Turtle: "species_turtles",
};

interface Filters {
  species: string[];
  gender: string[];
  size: string[];
  city: string[];
  status: string[];
  ageRange: string;
}

const EMPTY_FILTERS: Filters = { species: [], gender: [], size: [], city: [], status: [], ageRange: "any" };

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[rgba(8,157,151,0.12)] pb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full mb-3"
      >
        <span className="font-['Poppins',sans-serif] font-semibold text-[13px] text-[#1a2e2d]">{title}</span>
        {open ? <ChevronUp size={14} className="text-[#5a8a87]" /> : <ChevronDown size={14} className="text-[#5a8a87]" />}
      </button>
      {open && children}
    </div>
  );
}

function CheckboxOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div
        onClick={onChange}
        className={`w-4 h-4 rounded-[4px] border-2 flex items-center justify-center transition-colors ${checked ? "bg-[#089D97] border-[#089D97]" : "border-gray-300 group-hover:border-[#089D97]"}`}
      >
        {checked && (
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
            <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span className="font-['Poppins',sans-serif] text-[13px] text-[#1a2e2d]">{label}</span>
    </label>
  );
}

interface PetsListPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

export default function PetsListPage({ onNavigate }: PetsListPageProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adoptModalPet, setAdoptModalPet] = useState<Pet | null>(null);
  const [adoptForm, setAdoptForm] = useState({ name: "", phone: "", message: "" });
  const [adoptDone, setAdoptDone] = useState(false);

  const toggleFilter = (key: keyof Omit<Filters, "ageRange">, value: string) => {
    setFilters((prev) => {
      const arr = prev[key] as string[];
      return { ...prev, [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  };

  const hasActiveFilters =
    filters.species.length > 0 ||
    filters.gender.length > 0 ||
    filters.size.length > 0 ||
    filters.city.length > 0 ||
    filters.status.length > 0 ||
    filters.ageRange !== "any";

  const filteredPets = useMemo(() => {
    const q = search.toLowerCase().trim();
    return PETS.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !p.breed.toLowerCase().includes(q) && !p.species.toLowerCase().includes(q) && !p.city.toLowerCase().includes(q)) return false;
      if (filters.species.length && !filters.species.includes(p.species)) return false;
      if (filters.gender.length && !filters.gender.includes(p.gender)) return false;
      if (filters.size.length && !filters.size.includes(p.size)) return false;
      if (filters.city.length && !filters.city.includes(p.city)) return false;
      if (filters.status.length && !filters.status.includes(p.status)) return false;
      if (filters.ageRange === "baby" && p.ageMonths >= 12) return false;
      if (filters.ageRange === "young" && (p.ageMonths < 12 || p.ageMonths >= 36)) return false;
      if (filters.ageRange === "adult" && (p.ageMonths < 36 || p.ageMonths >= 84)) return false;
      if (filters.ageRange === "senior" && p.ageMonths < 84) return false;
      return true;
    });
  }, [search, filters]);

  const activeFilterCount =
    filters.species.length + filters.gender.length + filters.size.length + filters.city.length + filters.status.length + (filters.ageRange !== "any" ? 1 : 0);

  const Sidebar = (
    <aside className="w-full">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-[#1a2e2d]">{t("pets_filters")}</h2>
        {hasActiveFilters && (
          <button onClick={() => setFilters(EMPTY_FILTERS)} className="font-['Poppins',sans-serif] text-[12px] text-[#089D97] hover:underline flex items-center gap-1">
            <X size={12} /> {t("pets_clear_all")}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <FilterSection title={t("filter_species")}>
          <div className="flex flex-col gap-2">
            {ALL_SPECIES.map((s) => (
              <CheckboxOption key={s} label={`${SPECIES_ICONS[s] ?? "🐾"} ${t(SPECIES_KEY[s])}`} checked={filters.species.includes(s)} onChange={() => toggleFilter("species", s)} />
            ))}
          </div>
        </FilterSection>

        <FilterSection title={t("filter_gender")}>
          <div className="flex flex-col gap-2">
            {(["Male", "Female"] as const).map((g) => (
              <CheckboxOption key={g} label={t(g === "Male" ? "gender_male" : "gender_female")} checked={filters.gender.includes(g)} onChange={() => toggleFilter("gender", g)} />
            ))}
          </div>
        </FilterSection>

        <FilterSection title={t("filter_size")}>
          <div className="flex flex-col gap-2">
            {(["Small", "Medium", "Large"] as const).map((s) => (
              <CheckboxOption key={s} label={t(s === "Small" ? "size_small" : s === "Medium" ? "size_medium" : "size_large")} checked={filters.size.includes(s)} onChange={() => toggleFilter("size", s)} />
            ))}
          </div>
        </FilterSection>

        <FilterSection title={t("filter_age")}>
          <div className="flex flex-col gap-2">
            {[
              { value: "any",    key: "age_any" },
              { value: "baby",   key: "age_baby" },
              { value: "young",  key: "age_young" },
              { value: "adult",  key: "age_adult" },
              { value: "senior", key: "age_senior" },
            ].map(({ value, key }) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="ageRange"
                  value={value}
                  checked={filters.ageRange === value}
                  onChange={() => setFilters((f) => ({ ...f, ageRange: value }))}
                  className="accent-[#089D97]"
                />
                <span className="font-['Poppins',sans-serif] text-[13px] text-[#1a2e2d]">{t(key)}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        <FilterSection title={t("filter_city")}>
          <div className="flex flex-col gap-2">
            {PET_CITIES.map((c) => (
              <CheckboxOption key={c} label={c} checked={filters.city.includes(c)} onChange={() => toggleFilter("city", c)} />
            ))}
          </div>
        </FilterSection>

        <FilterSection title={t("filter_status")}>
          <div className="flex flex-col gap-2">
            {(["available", "pending"] as const).map((s) => (
              <CheckboxOption key={s} label={t(s === "available" ? "status_available" : "status_pending")} checked={filters.status.includes(s)} onChange={() => toggleFilter("status", s)} />
            ))}
          </div>
        </FilterSection>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#f0f8f7]">
      <Navbar onNavigate={onNavigate} />

      {/* Hero header */}
      <div className="bg-gradient-to-br from-[#089D97] to-[#047975] text-white py-10 px-5">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-['Prata',serif] text-[32px] lg:text-[40px] mb-2">{t("pets_title")}</h1>
          <p className="font-['Poppins',sans-serif] text-[15px] text-white/80 mb-6">
            {PETS.length} {t("pets_found")}.
          </p>

          {/* Search bar */}
          <div className="max-w-xl relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#089D97]" />
            <input
              placeholder={t("pets_search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-[14px] bg-white text-[#1a2e2d] font-['Poppins',sans-serif] text-[14px] shadow-lg outline-none focus:ring-2 focus:ring-white/50 transition-all placeholder-gray-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category chips */}
      <div className="max-w-6xl mx-auto px-5 py-5">
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setFilters((f) => ({ ...f, species: [] }))}
            className={`flex items-center gap-2 px-4 py-2 rounded-[20px] font-['Poppins',sans-serif] text-[13px] font-medium whitespace-nowrap transition-all ${filters.species.length === 0 ? "bg-[#089D97] text-white shadow-md" : "bg-white text-[#1a2e2d] hover:bg-[#e0f2f0]"}`}
          >
            🐾 {t("pets_all")}
          </button>
          {ALL_SPECIES.map((s) => (
            <button
              key={s}
              onClick={() => setFilters((f) => ({ ...f, species: [s] }))}
              className={`flex items-center gap-2 px-4 py-2 rounded-[20px] font-['Poppins',sans-serif] text-[13px] font-medium whitespace-nowrap transition-all ${filters.species.length === 1 && filters.species[0] === s ? "bg-[#089D97] text-white shadow-md" : "bg-white text-[#1a2e2d] hover:bg-[#e0f2f0]"}`}
            >
              {SPECIES_ICONS[s]} {t(SPECIES_KEY_PL[s])}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 pb-16 flex gap-6">
        {/* Desktop sidebar */}
        <div className="hidden lg:block w-[240px] shrink-0">
          <div className="bg-white rounded-[20px] shadow-sm p-5 sticky top-4">{Sidebar}</div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Mobile filter bar */}
          <div className="lg:hidden flex items-center justify-between mb-4">
            <p className="font-['Poppins',sans-serif] text-[14px] text-[#5a8a87]">
              <span className="font-semibold text-[#1a2e2d]">{filteredPets.length}</span> {t("pets_found")}
            </p>
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-[12px] shadow-sm font-['Poppins',sans-serif] text-[13px] text-[#1a2e2d] hover:shadow-md transition-shadow"
            >
              <SlidersHorizontal size={14} className="text-[#089D97]" />
              {t("pets_filters")}
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 bg-[#089D97] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Desktop results count */}
          <div className="hidden lg:flex items-center justify-between mb-5">
            <p className="font-['Poppins',sans-serif] text-[14px] text-[#5a8a87]">
              {t("pets_showing")} <span className="font-semibold text-[#1a2e2d]">{filteredPets.length}</span> {t("pets_of")} {PETS.length}
            </p>
            {hasActiveFilters && (
              <button onClick={() => setFilters(EMPTY_FILTERS)} className="flex items-center gap-1 font-['Poppins',sans-serif] text-[13px] text-[#089D97] hover:underline">
                <X size={13} /> {t("pets_clear_filters")}
              </button>
            )}
          </div>

          {filteredPets.length === 0 ? (
            <EmptyState
              icon={<PawPrint size={32} />}
              title={t("pets_no_found")}
              description={t("pets_no_found_desc")}
              actionLabel={t("pets_clear_all_filters")}
              onAction={() => { setSearch(""); setFilters(EMPTY_FILTERS); }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredPets.map((pet) => (
                <PetCard
                  key={pet.id}
                  pet={pet}
                  onViewDetails={(id) => onNavigate("pet-detail", { petId: id })}
                  onAdopt={(id) => {
                    const p = PETS.find((x) => x.id === id);
                    if (p) { setAdoptModalPet(p); setAdoptDone(false); }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative ml-auto w-[280px] h-full bg-white shadow-2xl overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-[#1a2e2d]">{t("pets_filters")}</h2>
              <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <X size={14} />
              </button>
            </div>
            {Sidebar}
            <button onClick={() => setSidebarOpen(false)} className="w-full mt-5 py-3 bg-[#089D97] text-white font-['Poppins',sans-serif] font-semibold text-[14px] rounded-[12px] hover:bg-[#047975] transition-colors">
              {t("pets_show_results")} ({filteredPets.length})
            </button>
          </div>
        </div>
      )}

      {/* Adopt modal */}
      {adoptModalPet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40" onClick={() => setAdoptModalPet(null)}>
          <div className="bg-white rounded-[24px] shadow-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            {adoptDone ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-3">🎉</div>
                <h3 className="font-['Poppins',sans-serif] font-semibold text-[20px] text-[#1a2e2d] mb-1">Application Sent!</h3>
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#5a8a87]">We will review your application and contact you shortly.</p>
                <button onClick={() => setAdoptModalPet(null)} className="mt-5 px-6 py-2.5 bg-[#089D97] text-white font-['Poppins',sans-serif] font-medium rounded-[12px] hover:bg-[#047975] transition-colors">
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-100">
                  <div className="w-14 h-14 rounded-[12px] bg-[#e8f5f4] overflow-hidden flex items-center justify-center">
                    <img src={adoptModalPet.image} alt={adoptModalPet.name} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="font-['Poppins',sans-serif] font-semibold text-[18px] text-[#1a2e2d]">Adopt {adoptModalPet.name}</h3>
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#5a8a87]">{adoptModalPet.breed}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[{ label: "Your Name", field: "name" as const, placeholder: "Full name" }, { label: "Phone Number", field: "phone" as const, placeholder: "+962-xx-xxxxxxx" }].map(({ label, field, placeholder }) => (
                    <div key={field}>
                      <label className="block font-['Poppins',sans-serif] text-[12px] text-[#5a8a87] mb-1">{label}</label>
                      <input value={adoptForm[field]} onChange={(e) => setAdoptForm((f) => ({ ...f, [field]: e.target.value }))} placeholder={placeholder} className="w-full border border-gray-200 rounded-[12px] px-3.5 py-2.5 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] focus:ring-1 focus:ring-[#089D97]/20 transition-all" />
                    </div>
                  ))}
                  <div>
                    <label className="block font-['Poppins',sans-serif] text-[12px] text-[#5a8a87] mb-1">Why do you want to adopt {adoptModalPet.name}?</label>
                    <textarea value={adoptForm.message} onChange={(e) => setAdoptForm((f) => ({ ...f, message: e.target.value }))} rows={3} placeholder="Tell us about yourself and your home…" className="w-full border border-gray-200 rounded-[12px] px-3.5 py-2.5 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] focus:ring-1 focus:ring-[#089D97]/20 transition-all resize-none" />
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setAdoptModalPet(null)} className="flex-1 py-2.5 border-2 border-gray-200 text-[#5a8a87] font-['Poppins',sans-serif] font-medium text-[13px] rounded-[12px] hover:border-gray-300 transition-colors">
                    Cancel
                  </button>
                  <button onClick={() => setAdoptDone(true)} className="flex-1 py-2.5 bg-[#089D97] text-white font-['Poppins',sans-serif] font-semibold text-[13px] rounded-[12px] hover:bg-[#047975] transition-colors">
                    Submit Application
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
