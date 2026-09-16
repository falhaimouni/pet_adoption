import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, X, ChevronDown, ChevronUp, PawPrint } from "lucide-react";
import Navbar from "../components/Navbar";
import PetCard from "../components/PetCard";
import EmptyState from "../components/EmptyState";
import { useLanguage } from "../context/LanguageContext";
import { apiFetch, PetResponse } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { PET_SPECIES_OPTIONS } from "../lib/formOptions";
import { getPetImageUrl } from "../lib/petImages";

// Re-export for backward compat
export type Pet = PetResponse;
export const PETS_DATA: PetResponse[] = [];

const SPECIES_ICONS: Record<string, string> = {
  Dog: "🐶",
  Cat: "🐱",
  Rabbit: "🐰",
  Bird: "🐦",
};

const ALL_SPECIES = [...PET_SPECIES_OPTIONS];

const SPECIES_KEY: Record<string, string> = {
  Dog: "species_dog", Cat: "species_cat", Rabbit: "species_rabbit",
  Bird: "species_bird",
};
const SPECIES_KEY_PL: Record<string, string> = {
  Dog: "species_dogs", Cat: "species_cats", Rabbit: "species_rabbits",
  Bird: "species_birds",
};

interface Filters {
  species: string[];
  status: string[];
  ageRange: string;
}

const EMPTY_FILTERS: Filters = { species: [], status: [], ageRange: "any" };

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
  embedded?: boolean;
}

export default function PetsListPage({ onNavigate, embedded = false }: PetsListPageProps) {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adoptModalPet, setAdoptModalPet] = useState<Pet | null>(null);
  const [adoptNote, setAdoptNote] = useState("");
  const [adoptDone, setAdoptDone] = useState(false);
  const [pets, setPets] = useState<PetResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggleFilter = (key: keyof Omit<Filters, "ageRange">, value: string) => {
    setFilters((prev) => {
      const arr = prev[key] as string[];
      return { ...prev, [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  };

  const hasActiveFilters =
    filters.species.length > 0 ||
    filters.status.length > 0 ||
    filters.ageRange !== "any";

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (filters.species.length === 1) params.set("species", filters.species[0]);
    if (filters.status.length === 1) params.set("status", filters.status[0]);
    if (filters.ageRange === "baby") params.set("maxAge", "0");
    if (filters.ageRange === "young") { params.set("minAge", "1"); params.set("maxAge", "2"); }
    if (filters.ageRange === "adult") { params.set("minAge", "3"); params.set("maxAge", "6"); }
    if (filters.ageRange === "senior") params.set("minAge", "7");

    setLoading(true);
    setError("");
    apiFetch<PetResponse[]>(`/pets${params.toString() ? `?${params}` : ""}`, { signal: controller.signal })
      .then(setPets)
      .catch((err) => {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : t("pets_load_error_title"));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [search, filters]);

  const activeFilterCount =
    filters.species.length + filters.status.length + (filters.ageRange !== "any" ? 1 : 0);

  async function submitAdoptionRequest() {
    if (!adoptModalPet) return;
    if (!isAuthenticated) {
      onNavigate("login");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await apiFetch("/adoption/requests", {
        method: "POST",
        body: JSON.stringify({ petId: adoptModalPet.petId, notes: adoptNote || undefined }),
      });
      setAdoptDone(true);
      setPets((current) => current.map((pet) => pet.petId === adoptModalPet.petId ? { ...pet, adoptionStatus: "PENDING" } : pet));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("pets_load_error_title"));
    } finally {
      setSubmitting(false);
    }
  }

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

        <FilterSection title={t("filter_status")}>
          <div className="flex flex-col gap-2">
            {(["AVAILABLE", "PENDING"] as const).map((s) => (
              <CheckboxOption key={s} label={t(s === "AVAILABLE" ? "status_available" : "status_pending")} checked={filters.status.includes(s)} onChange={() => toggleFilter("status", s)} />
            ))}
          </div>
        </FilterSection>
      </div>
    </aside>
  );

  return (
    <div className={embedded ? "" : "min-h-screen bg-[#f0f8f7]"}>
      {!embedded && <Navbar onNavigate={onNavigate} />}

      {/* Hero header */}
      <div className="bg-gradient-to-br from-[#089D97] to-[#047975] text-white py-10 px-5">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-['Prata',serif] text-[32px] lg:text-[40px] mb-2">{t("pets_title")}</h1>
          <p className="font-['Poppins',sans-serif] text-[15px] text-white/80 mb-6">
            {pets.length} {t("pets_found")}.
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
              <span className="font-semibold text-[#1a2e2d]">{pets.length}</span> {t("pets_found")}
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
              {t("pets_showing")} <span className="font-semibold text-[#1a2e2d]">{pets.length}</span> {t("pets_found")}
            </p>
            {hasActiveFilters && (
              <button onClick={() => setFilters(EMPTY_FILTERS)} className="flex items-center gap-1 font-['Poppins',sans-serif] text-[13px] text-[#089D97] hover:underline">
                <X size={13} /> {t("pets_clear_filters")}
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((n) => <div key={n} className="h-[360px] rounded-[22px] bg-white animate-pulse" />)}
            </div>
          ) : error ? (
            <EmptyState
              icon={<PawPrint size={32} />}
              title={t("pets_load_error_title")}
              description={error}
              actionLabel={t("common_try_again")}
              onAction={() => setFilters((f) => ({ ...f }))}
            />
          ) : pets.length === 0 ? (
            <EmptyState
              icon={<PawPrint size={32} />}
              title={t("pets_no_found")}
              description={t("pets_no_found_desc")}
              actionLabel={t("pets_clear_all_filters")}
              onAction={() => { setSearch(""); setFilters(EMPTY_FILTERS); }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {pets.map((pet) => (
                <PetCard
                  key={pet.petId}
                  pet={pet}
                  onViewDetails={(id) => onNavigate("pet-detail", { petId: id })}
                  onAdopt={(id) => {
                    const p = pets.find((x) => x.petId === id);
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
          <div className="relative ml-auto w-[min(88vw,320px)] h-full bg-white shadow-2xl overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-[#1a2e2d]">{t("pets_filters")}</h2>
              <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <X size={14} />
              </button>
            </div>
            {Sidebar}
            <button onClick={() => setSidebarOpen(false)} className="w-full mt-5 py-3 bg-[#089D97] text-white font-['Poppins',sans-serif] font-semibold text-[14px] rounded-[12px] hover:bg-[#047975] transition-colors">
              {t("pets_show_results")} ({pets.length})
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
                <h3 className="font-['Poppins',sans-serif] font-semibold text-[20px] text-[#1a2e2d] mb-1">{t("pet_sent_title")}</h3>
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#5a8a87]">{t("pet_sent_desc")}</p>
                <button onClick={() => setAdoptModalPet(null)} className="mt-5 px-6 py-2.5 bg-[#089D97] text-white font-['Poppins',sans-serif] font-medium rounded-[12px] hover:bg-[#047975] transition-colors">
                  {t("pet_done")}
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-100">
                  <div className="w-14 h-14 rounded-[12px] bg-[#e8f5f4] overflow-hidden flex items-center justify-center">
                    <img src={getPetImageUrl(adoptModalPet.images?.[0]?.imageUrl)} alt={adoptModalPet.name} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="font-['Poppins',sans-serif] font-semibold text-[18px] text-[#1a2e2d]">{t("pet_adopt_btn")} {adoptModalPet.name}</h3>
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#5a8a87]">{adoptModalPet.breed || adoptModalPet.species}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block font-['Poppins',sans-serif] text-[12px] text-[#5a8a87] mb-1">{t("pet_notes")}</label>
                    <textarea value={adoptNote} onChange={(e) => setAdoptNote(e.target.value)} rows={3} maxLength={1000} placeholder={t("pet_notes_ph")} className="w-full border border-gray-200 rounded-[12px] px-3.5 py-2.5 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] focus:ring-1 focus:ring-[#089D97]/20 transition-all resize-none" />
                  </div>
                  {error && <p className="font-['Poppins',sans-serif] text-[12px] text-red-600">{error}</p>}
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setAdoptModalPet(null)} className="flex-1 py-2.5 border-2 border-gray-200 text-[#5a8a87] font-['Poppins',sans-serif] font-medium text-[13px] rounded-[12px] hover:border-gray-300 transition-colors">
                    {t("pet_cancel")}
                  </button>
                  <button disabled={submitting} onClick={submitAdoptionRequest} className="flex-1 py-2.5 bg-[#089D97] text-white font-['Poppins',sans-serif] font-semibold text-[13px] rounded-[12px] hover:bg-[#047975] transition-colors disabled:opacity-60">
                    {submitting ? t("pet_submitting") : t("pet_submit")}
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
