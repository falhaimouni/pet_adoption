import { useState } from "react";
import { Camera, Save } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import profileImg from "../../imports/MyPetopia/0ade9078bed97f834442fbb8c3bc4424aaf43269.png";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";

interface ProfilePageProps { onNavigate: (page: string) => void; }

export default function ProfilePage({ onNavigate }: ProfilePageProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [firstName = "Adopter", ...lastParts] = (user?.name ?? "Adopter Demo").split(" ");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName,
    lastName: lastParts.join(" ") || "Demo",
    email: user?.email ?? "adopter@petopia.test",
    phone: user?.phone ?? "+962-6-5001234",
    city: "Amman",
    bio: user?.bio ?? "I love animals and I am ready to give a rescued pet a safe, loving home.",
  });

  const Field = ({ label, field }: { label: string; field: keyof typeof form }) => (
    <div>
      <label className="block font-['Poppins',sans-serif] font-medium text-[13px] text-black/60 mb-1">{label}</label>
      {editing ? (
        <input
          value={form[field]}
          onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
          className="w-full border border-[#089D97]/40 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[14px] text-black outline-none focus:border-[#089D97] transition-colors bg-white"
        />
      ) : (
        <p className="font-['Poppins',sans-serif] text-[15px] text-black">{form[field] || "—"}</p>
      )}
    </div>
  );

  return (
    <DashboardLayout role="adopter" activePage="profile" onNavigate={onNavigate} pageTitle="My Profile" breadcrumbs={["My Petopia", "My Profile"]}>
      <div className="max-w-2xl">
        {/* Avatar card */}
        <div className="bg-white rounded-[15px] shadow-md p-6 mb-5 flex items-center gap-6">
          <div className="relative">
            <div className="w-[90px] h-[90px] bg-[rgba(217,217,217,0.82)] rounded-full overflow-hidden">
              <img src={profileImg} alt="Profile" className="w-full h-full object-contain" />
            </div>
            {editing && (
              <button className="absolute bottom-0 right-0 w-7 h-7 bg-[#089D97] rounded-full flex items-center justify-center text-white shadow">
                <Camera size={14} />
              </button>
            )}
          </div>
          <div>
            <p className="font-['Poppins',sans-serif] font-semibold text-[20px] text-black">{form.firstName} {form.lastName}</p>
            <p className="font-['Poppins',sans-serif] text-[14px] text-[#089D97]">Adopter</p>
            <p className="font-['Poppins',sans-serif] text-[13px] text-black/60 mt-0.5">{form.city}, Jordan</p>
          </div>
          <div className="ml-auto">
            {editing ? (
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="px-4 py-2 border border-gray-300 rounded-[12px] font-['Poppins',sans-serif] text-[13px] hover:bg-gray-50 transition-colors">{t("adopter_cancel")}</button>
                <button onClick={() => setEditing(false)} className="flex items-center gap-2 px-4 py-2 bg-[#089D97] text-white rounded-[12px] font-['Poppins',sans-serif] font-medium text-[13px] hover:bg-[#047975] transition-colors">
                  <Save size={14} /> {t("adopter_save")}
                </button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)} className="px-4 py-2 border border-[#089D97] text-[#089D97] rounded-[12px] font-['Poppins',sans-serif] font-medium text-[13px] hover:bg-[rgba(8,157,151,0.1)] transition-colors">
                {t("adopter_edit")}
              </button>
            )}
          </div>
        </div>

        {/* Details card */}
        <div className="bg-white rounded-[15px] shadow-md p-6">
          <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black mb-5">{t("adopter_personal_info")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label={t("adopter_first_name")} field="firstName" />
            <Field label={t("adopter_last_name")} field="lastName" />
            <Field label={t("profile_email")} field="email" />
            <Field label={t("profile_phone")} field="phone" />
            <Field label={t("profile_city")} field="city" />
          </div>
          <div className="mt-5">
            <label className="block font-['Poppins',sans-serif] font-medium text-[13px] text-black/60 mb-1">{t("adopter_bio")}</label>
            {editing ? (
              <textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                rows={3}
                className="w-full border border-[#089D97]/40 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[14px] text-black outline-none focus:border-[#089D97] transition-colors resize-none"
              />
            ) : (
              <p className="font-['Poppins',sans-serif] text-[14px] text-black">{form.bio}</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
