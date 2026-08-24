import { useState, useRef } from "react";
import {
  Camera, Edit2, Save, X, User, Mail, Phone, Calendar, MapPin,
  MessageSquare, ClipboardList, ShoppingBag, Award, ChevronRight,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

interface UserProfilePageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

export default function UserProfilePage({ onNavigate }: UserProfilePageProps) {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const blank = {
    name: user?.name ?? "", username: user?.username ?? "", email: user?.email ?? "",
    phone: user?.phone ?? "", dob: user?.dob ?? "", gender: user?.gender ?? "",
    city: user?.city ?? "", address: user?.address ?? "", bio: user?.bio ?? "",
  };
  const [form, setForm] = useState(blank);
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatar ?? "");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleSave() {
    updateUser({ ...form, avatar: avatarPreview });
    setIsEditing(false);
  }

  function handleCancel() {
    setForm(blank);
    setAvatarPreview(user?.avatar ?? "");
    setIsEditing(false);
  }

  const initials = (form.name || "U").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const joinLabel = user?.joinDate
    ? new Date(user.joinDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "—";

  const stats = [
    { icon: ClipboardList, label: t("profile_applications"), value: "5", color: "text-[#089D97]", bg: "bg-[#e0f2f0]" },
    { icon: Award,         label: t("profile_adopted"),      value: "2", color: "text-emerald-600", bg: "bg-emerald-50" },
    { icon: ShoppingBag,   label: t("profile_orders"),       value: "7", color: "text-amber-600",   bg: "bg-amber-50" },
    { icon: MessageSquare, label: t("profile_messages"),     value: "5", color: "text-violet-600",  bg: "bg-violet-50" },
  ];

  const quickLinks = [
    { label: t("profile_my_applications"), page: "my-requests" },
    { label: t("profile_my_orders"),       page: "orders" },
    { label: t("nav_settings"),            page: "settings" },
  ];

  const fieldClass = "w-full px-4 py-3 rounded-[12px] font-['Poppins',sans-serif] text-[14px] text-[#1a2e2d] bg-[#f0f8f7] border border-transparent focus:border-[#089D97] outline-none transition-colors placeholder-gray-400";
  const readClass = "w-full px-4 py-3 rounded-[12px] font-['Poppins',sans-serif] text-[14px] text-[#1a2e2d] bg-transparent";

  return (
    <div className="min-h-screen bg-[#f0f8f7]">
      <Navbar onNavigate={onNavigate} />
      <div className="bg-gradient-to-br from-[#047975] to-[#089D97] h-36" />

      <div className="max-w-4xl mx-auto px-5 pb-16 -mt-16 relative z-10">
        {/* Header card */}
        <div className="bg-white rounded-[20px] shadow-lg p-6 mb-6 flex flex-col sm:flex-row sm:items-end gap-5">
          <div className="relative self-start">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#089D97] to-[#047975] flex items-center justify-center border-4 border-white shadow-md">
                <span className="font-['Poppins',sans-serif] font-bold text-2xl text-white">{initials}</span>
              </div>
            )}
            {isEditing && (
              <button onClick={() => fileRef.current?.click()} className="absolute bottom-0 right-0 w-8 h-8 bg-[#089D97] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#047975] transition-colors">
                <Camera size={14} />
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          <div className="flex-1">
            {isEditing ? (
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="font-['Prata',serif] text-2xl text-[#1a2e2d] bg-transparent border-b-2 border-[#089D97] outline-none w-full mb-1" placeholder={t("profile_full_name")} />
            ) : (
              <h1 className="font-['Prata',serif] text-2xl text-[#1a2e2d]">{form.name}</h1>
            )}
            <p className="font-['Poppins',sans-serif] text-[14px] text-[#5a8a87]">@{form.username}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-[#e0f2f0] text-[#047975] text-[12px] font-['Poppins',sans-serif] font-medium capitalize">{user?.role}</span>
              <span className="font-['Poppins',sans-serif] text-[12px] text-gray-400">· {t("profile_member_since")} {joinLabel}</span>
            </div>
          </div>

          <div className="flex gap-2 sm:self-start">
            {isEditing ? (
              <>
                <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] bg-[#089D97] text-white font-['Poppins',sans-serif] text-[13px] font-semibold hover:bg-[#047975] transition-colors shadow-sm">
                  <Save size={15} /> {t("profile_save")}
                </button>
                <button onClick={handleCancel} className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] bg-[#f0f8f7] text-[#5a8a87] font-['Poppins',sans-serif] text-[13px] font-semibold hover:bg-[#e0f2f0] transition-colors">
                  <X size={15} /> {t("profile_cancel")}
                </button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] bg-[#089D97] text-white font-['Poppins',sans-serif] text-[13px] font-semibold hover:bg-[#047975] transition-colors shadow-sm">
                <Edit2 size={15} /> {t("profile_edit")}
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {stats.map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="bg-white rounded-[16px] p-4 shadow-sm flex items-center gap-3">
              <div className={`w-10 h-10 rounded-[12px] ${bg} flex items-center justify-center`}>
                <Icon size={18} className={color} />
              </div>
              <div>
                <p className="font-['Poppins',sans-serif] font-bold text-lg text-[#1a2e2d] leading-none">{value}</p>
                <p className="font-['Poppins',sans-serif] text-[12px] text-[#5a8a87]">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-[20px] shadow-sm p-6">
            <h2 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-[#1a2e2d] mb-5">{t("profile_personal_info")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t("profile_full_name")} icon={User}>
                {isEditing ? <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={fieldClass} /> : <p className={readClass}>{form.name || "—"}</p>}
              </Field>
              <Field label={t("profile_username")} icon={User}>
                {isEditing ? <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className={fieldClass} /> : <p className={readClass}>@{form.username || "—"}</p>}
              </Field>
              <Field label={t("profile_email")} icon={Mail}>
                {isEditing ? <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={fieldClass} /> : <p className={readClass}>{form.email || "—"}</p>}
              </Field>
              <Field label={t("profile_phone")} icon={Phone}>
                {isEditing ? <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={fieldClass} /> : <p className={readClass}>{form.phone || "—"}</p>}
              </Field>
              <Field label={t("profile_dob")} icon={Calendar}>
                {isEditing ? <input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} className={fieldClass} /> : <p className={readClass}>{form.dob || "—"}</p>}
              </Field>
              <Field label={t("profile_gender")} icon={User}>
                {isEditing ? (
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={fieldClass}>
                    <option value="">{t("profile_select_gender")}</option>
                    <option value="Male">{t("gender_male")}</option>
                    <option value="Female">{t("gender_female")}</option>
                    <option value="Prefer not to say">{t("profile_prefer_not")}</option>
                  </select>
                ) : <p className={readClass}>{form.gender || "—"}</p>}
              </Field>
              <Field label={t("profile_city")} icon={MapPin}>
                {isEditing ? <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={fieldClass} /> : <p className={readClass}>{form.city || "—"}</p>}
              </Field>
              <Field label={t("profile_address")} icon={MapPin}>
                {isEditing ? <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={fieldClass} /> : <p className={readClass}>{form.address || "—"}</p>}
              </Field>
            </div>
            <div className="mt-4">
              <label className="block font-['Poppins',sans-serif] text-[12px] font-semibold text-[#5a8a87] uppercase tracking-wider mb-2">{t("profile_bio")}</label>
              {isEditing ? (
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className={`${fieldClass} resize-none`} placeholder={t("profile_bio_ph")} />
              ) : (
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#1a2e2d] leading-relaxed">{form.bio || t("profile_no_bio")}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-[20px] shadow-sm p-5">
              <h3 className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#1a2e2d] mb-4">{t("profile_account")}</h3>
              <div className="space-y-3">
                <Row label={t("profile_account_type")} value={user?.role ?? "—"} capitalize />
                <Row label={t("profile_member_since")} value={joinLabel} />
                <Row label={t("profile_last_login")} value={t("profile_today")} />
              </div>
            </div>
            <div className="bg-white rounded-[20px] shadow-sm p-5">
              <h3 className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#1a2e2d] mb-4">{t("profile_quick_links")}</h3>
              <div className="space-y-1">
                {quickLinks.map(({ label, page }) => (
                  <button key={page} onClick={() => onNavigate(page)} className="w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] hover:bg-[#f0f8f7] transition-colors group">
                    <span className="font-['Poppins',sans-serif] text-[13px] text-[#1a2e2d]">{label}</span>
                    <ChevronRight size={14} className="text-[#5a8a87] group-hover:text-[#089D97] transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 font-['Poppins',sans-serif] text-[12px] font-semibold text-[#5a8a87] uppercase tracking-wider mb-1.5">
        <Icon size={12} className="text-[#089D97]" />
        {label}
      </label>
      {children}
    </div>
  );
}

function Row({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="font-['Poppins',sans-serif] text-[13px] text-[#5a8a87]">{label}</span>
      <span className={`font-['Poppins',sans-serif] text-[13px] font-medium text-[#1a2e2d] ${capitalize ? "capitalize" : ""}`}>{value}</span>
    </div>
  );
}
