import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle, PawPrint, X } from "lucide-react";
import Navbar from "../components/Navbar";
import EmptyState from "../components/EmptyState";
import { apiFetch, PetResponse } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { getPetImageUrl, defaultPetImage } from "../lib/petImages";

interface PetDetailPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
  petId?: string;
  embedded?: boolean;
}

function valueOrDash(value?: string | number | null) {
  return value === undefined || value === null || value === "" ? "-" : String(value);
}

function statusLabel(status: string, t: (key: string) => string) {
  const normalized = status.toUpperCase();
  if (normalized === "AVAILABLE") return t("status_available");
  if (normalized === "PENDING") return t("status_pending");
  if (normalized === "ADOPTED") return t("status_adopted");
  return t("common_unavailable");
}

interface PetFullResponse extends PetResponse {
  medicalRecord?: { recordId: string; createdAt: string } | null;
  vaccinations?: Array<{ vaccinationId: string; vaccineName: string; vaccinationDate: string; nextDueDate?: string | null }>;
}

export default function PetDetailPage({ onNavigate, petId, embedded = false }: PetDetailPageProps) {
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const [pet, setPet] = useState<PetFullResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adoptOpen, setAdoptOpen] = useState(false);
  const [adoptDone, setAdoptDone] = useState(false);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!petId) {
      setError(t("common_missing_id"));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    const canViewFull = isAuthenticated && user?.role !== "adopter";
    apiFetch<PetFullResponse>(`/pets/${petId}${canViewFull ? "/full" : ""}`)
      .then(setPet)
      .catch((err) => setError(err instanceof Error ? err.message : t("pet_not_found_desc")))
      .finally(() => setLoading(false));
  }, [isAuthenticated, petId, t, user?.role]);

  useEffect(() => {
    setImageError(false);
  }, [pet?.petId, pet?.images?.[0]?.imageUrl]);

  async function submitAdoptionRequest() {
    if (!pet) return;
    if (!isAuthenticated) {
      onNavigate("login");
      return;
    }
    if (user?.role !== "adopter") {
      setSubmitError(t("pet_adopter_only_requests"));
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      await apiFetch("/adoption/requests", {
        method: "POST",
        body: JSON.stringify({ petId: pet.petId, notes: note || undefined }),
      });
      setPet({ ...pet, adoptionStatus: "PENDING" });
      setAdoptDone(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t("pet_submit_error"));
    } finally {
      setSubmitting(false);
    }
  }

  const status = pet?.adoptionStatus.toUpperCase() ?? "";
  const imageUrl = getPetImageUrl(pet?.images?.[0]?.imageUrl);

  return (
    <div className={embedded ? "" : "min-h-screen bg-[#f0f8f7]"}>
      {!embedded && <Navbar onNavigate={onNavigate} />}

      <div className="max-w-5xl mx-auto px-5 pt-6 pb-16">
        <button
          onClick={() => onNavigate("pets")}
          className="flex items-center gap-2 font-['Poppins',sans-serif] text-[13px] text-[#5a8a87] hover:text-[#089D97] mb-6 group transition-colors"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> {t("pet_back")}
        </button>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-[4/3] rounded-[24px] bg-white animate-pulse" />
            <div className="h-[420px] rounded-[24px] bg-white animate-pulse" />
          </div>
        ) : error || !pet ? (
          <EmptyState icon={<PawPrint size={32} />} title={t("pet_not_found")} description={error || t("pet_not_found_desc")} actionLabel={t("pet_back_to_pets")} onAction={() => onNavigate("pets")} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
              <div className="relative bg-white rounded-[24px] shadow-sm overflow-hidden aspect-[4/3] flex items-center justify-center">
                <img
                  src={imageError ? defaultPetImage : imageUrl}
                  alt={pet.name}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-contain"
                />
                <span className={`absolute top-4 left-4 px-3 py-1 rounded-full font-['Poppins',sans-serif] text-[12px] font-semibold capitalize ${status === "AVAILABLE" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {statusLabel(pet.adoptionStatus, t)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <h1 className="font-['Prata',serif] text-[36px] text-[#1a2e2d] leading-tight">{pet.name}</h1>
                <p className="font-['Poppins',sans-serif] text-[16px] text-[#5a8a87] mt-1">{pet.breed || pet.species}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t("pet_stat_age"), value: pet.age == null ? "-" : `${pet.age} ${pet.age === 1 ? t("common_year") : t("common_years")}` },
                  { label: t("pet_stat_gender"), value: valueOrDash(pet.gender) },
                  { label: t("pet_stat_color"), value: valueOrDash(pet.color) },
                  { label: t("pet_stat_weight"), value: pet.weight == null ? "-" : `${pet.weight} kg` },
                  { label: t("pet_stat_health"), value: valueOrDash(pet.healthStatus) },
                  { label: t("pet_arrival"), value: valueOrDash(pet.arrivalDate) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white rounded-[14px] p-3 shadow-sm">
                    <p className="font-['Poppins',sans-serif] text-[10px] text-[#5a8a87] uppercase tracking-wider">{label}</p>
                    <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#1a2e2d] mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-[20px] p-5 shadow-sm">
                <h3 className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#089D97] uppercase tracking-wider mb-2">{t("pet_about")} {pet.name}</h3>
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#1a2e2d]/80 leading-relaxed">{pet.description || t("pet_no_description")}</p>
              </div>

              {isAuthenticated && user?.role !== "adopter" && (
                <div className="bg-white rounded-[20px] p-5 shadow-sm">
                  <h3 className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#089D97] uppercase tracking-wider mb-2">{t("pet_internal_health_summary")}</h3>
                  <div className="space-y-2 font-['Poppins',sans-serif] text-[13px] text-[#1a2e2d]/80">
                    <p>{t("pet_medical_record_label")} <span className="font-semibold text-[#1a2e2d]">{pet.medicalRecord ? t("common_available") : t("common_not_created")}</span></p>
                    <div>
                      <p className="font-semibold text-[#1a2e2d] mb-1">{t("vet_vaccinations")}</p>
                      {(pet.vaccinations ?? []).length === 0 ? (
                        <p className="text-[#5a8a87]">{t("vet_no_vaccinations")}</p>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {pet.vaccinations?.map((vaccination) => (
                            <div key={vaccination.vaccinationId} className="flex justify-between gap-3 border-b border-[#f0f8f7] pb-1 last:border-0">
                              <span>{vaccination.vaccineName}</span>
                              <span className="text-[#5a8a87]">{vaccination.vaccinationDate}{vaccination.nextDueDate ? ` -> ${vaccination.nextDueDate}` : ""}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {status === "AVAILABLE" && (!isAuthenticated || user?.role === "adopter") ? (
                <button
                  onClick={() => { setAdoptOpen(true); setAdoptDone(false); setSubmitError(""); }}
                  className="py-3.5 bg-[#089D97] text-white font-['Poppins',sans-serif] font-semibold text-[15px] rounded-[14px] hover:bg-[#047975] transition-colors shadow-md"
                >
                  {t("pet_adopt_btn")} {pet.name}
                </button>
              ) : status === "AVAILABLE" ? (
                <div className="py-3.5 bg-[#f0f8f7] border-2 border-[#bae0dd] text-[#047975] font-['Poppins',sans-serif] font-semibold text-[15px] rounded-[14px] text-center">
                  {t("pet_adopter_only_requests")}
                </div>
              ) : (
                <div className="py-3.5 bg-amber-50 border-2 border-amber-200 text-amber-700 font-['Poppins',sans-serif] font-semibold text-[15px] rounded-[14px] text-center capitalize">
                  {statusLabel(pet.adoptionStatus, t)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {adoptOpen && pet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40" onClick={() => setAdoptOpen(false)}>
          <div className="bg-white rounded-[24px] shadow-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            {adoptDone ? (
              <div className="text-center py-8">
                <CheckCircle size={48} className="text-[#089D97] mx-auto mb-3" />
                <h3 className="font-['Poppins',sans-serif] font-semibold text-[22px] text-[#1a2e2d] mb-1">{t("pet_sent_title")}</h3>
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#5a8a87]">{t("pet_sent_desc")}</p>
                <button onClick={() => setAdoptOpen(false)} className="mt-6 px-8 py-2.5 bg-[#089D97] text-white font-['Poppins',sans-serif] font-semibold rounded-[12px] hover:bg-[#047975] transition-colors">
                  {t("pet_done")}
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div>
                    <h3 className="font-['Poppins',sans-serif] font-semibold text-[20px] text-[#1a2e2d] mb-1">{t("pet_adopt_btn")} {pet.name}</h3>
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#5a8a87]">{t("pet_request_subtitle")}</p>
                  </div>
                  <button onClick={() => setAdoptOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
                    <X size={15} />
                  </button>
                </div>
                <label className="block font-['Poppins',sans-serif] text-[12px] text-[#5a8a87] mb-1">{t("pet_notes")}</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} maxLength={1000} placeholder={t("pet_notes_ph")} className="w-full border border-gray-200 rounded-[12px] px-4 py-2.5 font-['Poppins',sans-serif] text-[14px] outline-none focus:border-[#089D97] focus:ring-1 focus:ring-[#089D97]/20 transition-all resize-none" />
                {submitError && <p className="mt-3 font-['Poppins',sans-serif] text-[12px] text-red-600">{submitError}</p>}
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setAdoptOpen(false)} className="flex-1 py-2.5 border-2 border-gray-200 text-[#5a8a87] font-['Poppins',sans-serif] font-medium text-[14px] rounded-[12px] hover:border-gray-300 transition-colors">{t("pet_cancel")}</button>
                  <button disabled={submitting} onClick={submitAdoptionRequest} className="flex-1 py-2.5 bg-[#089D97] text-white font-['Poppins',sans-serif] font-semibold text-[14px] rounded-[12px] hover:bg-[#047975] transition-colors disabled:opacity-60">{submitting ? t("pet_submitting") : t("pet_submit")}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
