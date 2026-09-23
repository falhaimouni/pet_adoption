import { useEffect, useState, useRef } from "react";
import {
  Camera, Edit2, Save, X, User, Mail, Phone,
  ClipboardList, Heart, ChevronRight, MapPin,
} from "lucide-react";
import Navbar from "../components/Navbar";
import BackHomeButton from "../components/BackHomeButton";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { apiFetch } from "../lib/api";
import { validateImageFile } from "../lib/validation";
import AuthenticatedImage from "../components/AuthenticatedImage";

interface UserProfilePageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
  embedded?: boolean;
}

export default function UserProfilePage({ onNavigate, embedded = false }: UserProfilePageProps) {
  const { user, updateUser } = useAuth();
  const { lang, t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [firstName, ...lastParts] = (user?.name ?? "").split(" ");
  const blank = {
    firstName: firstName ?? "",
    lastName: lastParts.join(" "),
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    address: user?.address ?? "",
  };
  const [form, setForm] = useState(blank);
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatar ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(blank);
    setAvatarPreview(user?.avatar ?? "");
  }, [user?.id, user?.name, user?.email, user?.phone, user?.address, user?.avatar]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImageFile(file, t);
    if (validation) {
      setError(validation);
      e.target.value = "";
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setError("");
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError(t("profile_first_last_required"));
      return;
    }
    setSaving(true);
    try {
      const profile = await apiFetch<{
        firstName: string;
        lastName: string;
        phone?: string | null;
        address?: string | null;
        avatar?: string | null;
      }>("/users/profile", {
        method: "PATCH",
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone || undefined,
          address: form.address.trim(),
        }),
      });
      let nextAvatar = profile.avatar ?? user?.avatar;
      if (avatarFile) {
        const body = new FormData();
        body.append("file", avatarFile);
        const uploaded = await apiFetch<{ avatar?: string | null }>("/users/profile/avatar", {
          method: "POST",
          body,
        });
        nextAvatar = uploaded.avatar ?? undefined;
      }
      updateUser({ name: `${profile.firstName} ${profile.lastName}`.trim(), phone: profile.phone ?? undefined, address: profile.address ?? undefined, avatar: nextAvatar });
      setAvatarPreview(nextAvatar ?? "");
      setAvatarFile(null);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error_save_profile"));
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setForm(blank);
    setAvatarPreview(user?.avatar ?? "");
    setAvatarFile(null);
    setIsEditing(false);
  }

  const displayName = `${form.firstName} ${form.lastName}`.trim();
  const displayHandle = form.email ? form.email.split("@")[0] : "";
  const initials = (displayName || "U").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const locale = lang === "ar" ? "ar-JO" : lang === "fr" ? "fr-FR" : "en-US";
  const joinLabel = user?.joinDate
    ? new Date(user.joinDate).toLocaleDateString(locale, { month: "short", year: "numeric" })
    : "—";

  const role = user?.role ?? "adopter";
  const roleHome: Record<string, string> = {
    adopter: "pets",
    employee: "staff-dashboard",
    vet: "vet-dashboard",
    manager: "manager-dashboard",
    admin: "admin-dashboard",
  };
  const roleWork: Record<string, { label: string; page: string }> = {
    adopter: { label: t("profile_my_applications"), page: "my-requests" },
    employee: { label: t("nav_adoption_requests"), page: "staff-requests" },
    vet: { label: t("nav_medical_records"), page: "vet-medical" },
    manager: { label: t("nav_inventory"), page: "manager-inventory" },
    admin: { label: t("nav_users"), page: "admin-users" },
  };

  const stats = role === "adopter"
    ? [
        { icon: ClipboardList, label: t("profile_applications"), page: "my-requests", color: "text-[#089D97]", bg: "bg-[#e0f2f0]" },
        { icon: Heart, label: t("profile_adopted"), page: "my-adoptions", color: "text-emerald-600", bg: "bg-emerald-50" },
      ]
    : [
        { icon: ClipboardList, label: t("nav_dashboard"), page: roleHome[role], color: "text-[#089D97]", bg: "bg-[#e0f2f0]" },
        { icon: Heart, label: roleWork[role].label, page: roleWork[role].page, color: "text-emerald-600", bg: "bg-emerald-50" },
      ];

  const quickLinks = role === "adopter"
    ? [
        { label: t("profile_my_applications"), page: "my-requests" },
        { label: t("nav_my_adoptions"), page: "my-adoptions" },
        { label: t("nav_settings"), page: "settings" },
      ]
    : [
        { label: t("nav_dashboard"), page: roleHome[role] },
        roleWork[role],
        { label: t("nav_settings"), page: "settings" },
      ];

  const fieldClass = "w-full px-4 py-3 rounded-[12px] font-['Poppins',sans-serif] text-[14px] text-[#1a2e2d] bg-[#f0f8f7] border border-transparent focus:border-[#089D97] outline-none transition-colors placeholder-gray-400";
  const readClass = "w-full px-4 py-3 rounded-[12px] font-['Poppins',sans-serif] text-[14px] text-[#1a2e2d] bg-transparent";

  return (
    <div className={embedded ? "" : "min-h-screen bg-[#f0f8f7]"}>
      {!embedded && <Navbar onNavigate={onNavigate} />}
      <div className="bg-gradient-to-br from-[#047975] to-[#089D97] h-36" />

      <div className="max-w-4xl mx-auto px-5 pb-16 -mt-16 relative z-10">
        {/* Header card */}
        <div className="bg-white rounded-[20px] shadow-lg p-6 mb-6 flex flex-col sm:flex-row sm:items-end gap-5">
          <div className="relative self-start">
            {avatarPreview ? (
              <AuthenticatedImage src={avatarPreview} alt={t("profile_avatar_alt")} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
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
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
          </div>

          <div className="flex-1">
            <h1 className="font-['Prata',serif] text-2xl text-[#1a2e2d]">{displayName}</h1>
            {displayHandle && <p className="font-['Poppins',sans-serif] text-[14px] text-[#5a8a87]">@{displayHandle}</p>}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-[#e0f2f0] text-[#047975] text-[12px] font-['Poppins',sans-serif] font-medium capitalize">{user?.role}</span>
              <span className="font-['Poppins',sans-serif] text-[12px] text-gray-400">· {t("profile_member_since")} {joinLabel}</span>
            </div>
          </div>

          <div className="flex gap-2 sm:self-start">
            <BackHomeButton onNavigate={onNavigate} />
            {isEditing ? (
              <>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] bg-[#089D97] text-white font-['Poppins',sans-serif] text-[13px] font-semibold hover:bg-[#047975] transition-colors shadow-sm disabled:opacity-60">
                  <Save size={15} /> {saving ? t("profile_saving") : t("profile_save")}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {stats.map(({ icon: Icon, label, page, color, bg }) => (
            <button key={label} onClick={() => onNavigate(page)} className="bg-white rounded-[16px] p-4 shadow-sm flex items-center gap-3 text-left hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-[12px] ${bg} flex items-center justify-center`}>
                <Icon size={18} className={color} />
              </div>
              <div>
                <p className="font-['Poppins',sans-serif] text-[12px] text-[#5a8a87]">{label}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-[20px] shadow-sm p-6">
            <h2 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-[#1a2e2d] mb-5">{t("profile_personal_info")}</h2>
            {error && <p role="alert" className="whitespace-pre-line font-['Poppins',sans-serif] text-[13px] text-red-600 bg-red-50 rounded-[12px] px-4 py-3 mb-4">{error}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t("adopter_first_name")} icon={User}>
                {isEditing ? <input maxLength={80} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={fieldClass} /> : <p className={readClass}>{form.firstName || "—"}</p>}
              </Field>
              <Field label={t("adopter_last_name")} icon={User}>
                {isEditing ? <input maxLength={80} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={fieldClass} /> : <p className={readClass}>{form.lastName || "—"}</p>}
              </Field>
              <Field label={t("profile_email")} icon={Mail}>
                <p className={`${readClass} text-black/60`}>{form.email || "—"}</p>
              </Field>
              <Field label={t("profile_phone")} icon={Phone}>
                {isEditing ? <input maxLength={30} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={fieldClass} /> : <p className={readClass}>{form.phone || "—"}</p>}
              </Field>
              <Field label={t("profile_address")} icon={MapPin}>
                {isEditing ? <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={3} maxLength={1000} className={`${fieldClass} resize-none sm:col-span-2`} /> : <p className={readClass}>{form.address || "—"}</p>}
              </Field>
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
