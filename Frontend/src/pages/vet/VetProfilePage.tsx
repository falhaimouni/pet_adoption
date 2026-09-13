import { useState, useRef } from "react";
import { Camera, Edit2, Save, X, Stethoscope, Award, Phone, Mail, MapPin, FileText } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";

const VET_DEFAULT = {
  name: "Dr. Khaled Al-Rashid",
  email: "k.alrashid@petopia.com",
  phone: "+962 799 281 091",
  specialization: "Small Animal Medicine & Surgery",
  licenseNumber: "VET-JO-2019-0472",
  experience: "7 years",
  clinic: "Petopia Veterinary Center",
  clinicAddress: "123 Paw Street, Amman, Jordan",
  bio: "Specializing in small animal internal medicine and preventive care. Passionate about improving the quality of life for shelter animals.",
};

interface VetProfilePageProps { onNavigate: (page: string) => void; }

export default function VetProfilePage({ onNavigate }: VetProfilePageProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    ...VET_DEFAULT,
    name: user?.name ?? VET_DEFAULT.name,
    email: user?.email ?? VET_DEFAULT.email,
    phone: user?.phone ?? VET_DEFAULT.phone,
  });
  const [avatar, setAvatar] = useState<string>("");
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatar(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleSave() {
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleCancel() {
    setIsEditing(false);
  }

  const initials = form.name.split(" ").filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const inputClass = "w-full border border-gray-200 rounded-[10px] px-3 py-2.5 font-['Poppins',sans-serif] text-[14px] text-black outline-none focus:border-[#089D97] bg-[#f0f8f7] transition-colors";
  const readClass = "font-['Poppins',sans-serif] text-[14px] text-black px-3 py-2.5 bg-transparent";
  const labelClass = "block font-['Poppins',sans-serif] text-[11px] font-semibold text-black/50 uppercase tracking-wider mb-1.5";

  return (
    <DashboardLayout role="vet" activePage="vet-profile" onNavigate={onNavigate} pageTitle={t("nav_my_profile")} breadcrumbs={["Vet", t("nav_my_profile")]}>
      {saved && (
        <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-[12px] px-4 py-3">
          <Save size={16} className="text-green-500" />
          <p className="font-['Poppins',sans-serif] text-[13px] text-green-700">{t("action_save")} — {t("security_pw_success")}</p>
        </div>
      )}

      {/* Header card */}
      <div className="bg-gradient-to-br from-[#047975] to-[#089D97] h-28 rounded-t-[20px]" />
      <div className="bg-white rounded-b-[20px] shadow-md px-6 pb-6 mb-5 -mt-1">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 pb-4 border-b border-gray-100">
          {/* Avatar */}
          <div className="relative self-start">
            {avatar ? (
              <img src={avatar} alt={form.name} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#089D97] to-[#047975] flex items-center justify-center border-4 border-white shadow-md">
                <span className="font-['Poppins',sans-serif] font-bold text-2xl text-white">{initials}</span>
              </div>
            )}
            {isEditing && (
              <button onClick={() => fileRef.current?.click()} className="absolute bottom-0 right-0 w-7 h-7 bg-[#089D97] text-white rounded-full flex items-center justify-center shadow hover:bg-[#047975] transition-colors">
                <Camera size={12} />
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
          <div className="flex-1">
            <h2 className="font-['Prata',serif] text-[22px] text-[#1a2e2d]">{form.name}</h2>
            <p className="font-['Poppins',sans-serif] text-[13px] text-[#089D97]">{form.specialization}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#e0f2f0] text-[#047975] text-[11px] font-['Poppins',sans-serif] font-medium">
                <Stethoscope size={10} /> {t("role_vet")}
              </span>
              <span className="font-['Poppins',sans-serif] text-[11px] text-gray-400">· {t("vet_license")} {form.licenseNumber}</span>
            </div>
          </div>
          <div className="flex gap-2 sm:self-start mt-2 sm:mt-10">
            {isEditing ? (
              <>
                <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-[#089D97] text-white rounded-[10px] font-['Poppins',sans-serif] text-[13px] font-semibold hover:bg-[#047975] transition-colors">
                  <Save size={14} /> {t("action_save")}
                </button>
                <button onClick={handleCancel} className="flex items-center gap-2 px-4 py-2 bg-[#f0f8f7] text-[#5a8a87] rounded-[10px] font-['Poppins',sans-serif] text-[13px] font-semibold hover:bg-[#e0f2f0] transition-colors">
                  <X size={14} /> {t("action_cancel")}
                </button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-[#089D97] text-white rounded-[10px] font-['Poppins',sans-serif] text-[13px] font-semibold hover:bg-[#047975] transition-colors shadow-sm">
                <Edit2 size={14} /> {t("settings_edit_profile")}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main form */}
        <div className="lg:col-span-2 bg-white rounded-[20px] shadow-md p-6">
          <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black mb-5">{t("profile_personal_info")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t("profile_full_name")}</label>
              {isEditing ? <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} /> : <p className={readClass}>{form.name}</p>}
            </div>
            <div>
              <label className={labelClass}>{t("profile_email")}</label>
              {isEditing ? <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputClass} /> : <p className={readClass}>{form.email}</p>}
            </div>
            <div>
              <label className={labelClass}>{t("profile_phone")}</label>
              {isEditing ? <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={inputClass} /> : <p className={readClass}>{form.phone}</p>}
            </div>
            <div>
              <label className={labelClass}>{t("vet_specialization")}</label>
              {isEditing ? <input value={form.specialization} onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))} className={inputClass} /> : <p className={readClass}>{form.specialization}</p>}
            </div>
            <div>
              <label className={labelClass}>{t("vet_license")}</label>
              {isEditing ? <input value={form.licenseNumber} onChange={(e) => setForm((f) => ({ ...f, licenseNumber: e.target.value }))} className={inputClass} /> : <p className={readClass}>{form.licenseNumber}</p>}
            </div>
            <div>
              <label className={labelClass}>{t("profile_experience") || "Years of Experience"}</label>
              {isEditing ? <input value={form.experience} onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))} className={inputClass} /> : <p className={readClass}>{form.experience}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>{t("profile_bio")}</label>
              {isEditing
                ? <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} rows={3} className={`${inputClass} resize-none`} />
                : <p className={`${readClass} leading-relaxed`}>{form.bio}</p>}
            </div>
          </div>

          <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black mb-4 mt-6">{t("vet_clinic") || "Clinic Information"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t("vet_clinic_name") || "Clinic Name"}</label>
              {isEditing ? <input value={form.clinic} onChange={(e) => setForm((f) => ({ ...f, clinic: e.target.value }))} className={inputClass} /> : <p className={readClass}>{form.clinic}</p>}
            </div>
            <div>
              <label className={labelClass}>{t("vet_clinic_address") || "Clinic Address"}</label>
              {isEditing ? <input value={form.clinicAddress} onChange={(e) => setForm((f) => ({ ...f, clinicAddress: e.target.value }))} className={inputClass} /> : <p className={readClass}>{form.clinicAddress}</p>}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-5">
          {/* Stats */}
          <div className="bg-white rounded-[20px] shadow-md p-5">
            <h3 className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black mb-4">{t("vet_my_profile")}</h3>
            {[
              { icon: Stethoscope, label: t("vet_patients"), value: "142", color: "text-[#089D97]", bg: "bg-[#e0f2f0]" },
              { icon: Award, label: t("vet_vaccinations"), value: "318", color: "text-blue-500", bg: "bg-blue-50" },
              { icon: FileText, label: t("vet_medical_records"), value: "96", color: "text-violet-500", bg: "bg-violet-50" },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                <div className={`w-9 h-9 ${bg} rounded-[10px] flex items-center justify-center flex-shrink-0`}>
                  <Icon size={16} className={color} />
                </div>
                <div className="flex-1">
                  <p className="font-['Poppins',sans-serif] font-bold text-[16px] text-black leading-none">{value}</p>
                  <p className="font-['Poppins',sans-serif] text-[11px] text-black/50">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="bg-white rounded-[20px] shadow-md p-5">
            <h3 className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black mb-3">{t("profile_contact") || "Contact"}</h3>
            {[
              { icon: Mail, value: form.email },
              { icon: Phone, value: form.phone },
              { icon: MapPin, value: form.clinicAddress },
            ].map(({ icon: Icon, value }) => (
              <div key={value} className="flex items-start gap-2.5 py-1.5">
                <Icon size={14} className="text-[#089D97] mt-0.5 flex-shrink-0" />
                <span className="font-['Poppins',sans-serif] text-[12px] text-black/70 break-all">{value}</span>
              </div>
            ))}
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-[20px] shadow-md p-5">
            <h3 className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black mb-3">{t("settings_security")}</h3>
            {user?.provider === "GOOGLE" ? (
              <p className="font-['Poppins',sans-serif] text-[13px] text-black/60">Password management is handled through Google.</p>
            ) : (
              <div className="flex flex-col gap-2">
                <button onClick={() => onNavigate("settings")} className="w-full py-2.5 border border-[#089D97] text-[#089D97] rounded-[12px] font-['Poppins',sans-serif] font-medium text-[13px] hover:bg-[rgba(8,157,151,0.06)] transition-colors">
                  {t("security_change_pw")}
                </button>
                <button onClick={() => onNavigate("forgot-password")} className="w-full py-2.5 bg-[#f0f8f7] text-[#047975] rounded-[12px] font-['Poppins',sans-serif] font-medium text-[13px] hover:bg-[#e0f2f0] transition-colors">
                  {t("login_forgot")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
