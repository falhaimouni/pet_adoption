import { useState } from "react";
import {
  User, Palette, Globe, Lock, Shield, HelpCircle,
  ChevronRight, Moon, Sun, LogOut, Eye, EyeOff,
  CheckCircle, AlertTriangle, ExternalLink,
} from "lucide-react";
import Navbar from "../components/Navbar";
import BackHomeButton from "../components/BackHomeButton";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { apiFetch } from "../lib/api";
import { isStrongPassword } from "../lib/validation";

interface SettingsPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
  embedded?: boolean;
}

type SettingsTab = "account" | "appearance" | "language" | "security" | "help";

export default function SettingsPage({ onNavigate, embedded = false }: SettingsPageProps) {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const locale = lang === "ar" ? "ar-JO" : "en-US";

  const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: "account",       label: t("settings_account"),       icon: User },
    { id: "appearance",    label: t("settings_appearance"),    icon: Palette },
    { id: "language",      label: t("settings_language"),      icon: Globe },
    { id: "security",      label: t("settings_security"),      icon: Shield },
    { id: "help",          label: t("settings_help"),          icon: HelpCircle },
  ];
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwShow, setPwShow] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState("");

  async function handlePasswordSave() {
    setPwError("");
    setPwSuccess(false);
    if (!isStrongPassword(pwForm.next)) {
      setPwError("Password must include uppercase, lowercase, number, and symbol.");
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError("Passwords do not match.");
      return;
    }
    try {
      await apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: pwForm.current,
          newPassword: pwForm.next,
          confirmPassword: pwForm.confirm,
        }),
      });
      setPwSuccess(true);
      setPwForm({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : t("error_update_password"));
    }
  }

  return (
    <div className={embedded ? "" : "min-h-screen bg-[#f0f8f7]"}>
      {!embedded && <Navbar onNavigate={onNavigate} />}
      <div className="max-w-5xl mx-auto px-5 py-8 pb-16">
        <div className="mb-6 flex items-center gap-3">
          <BackHomeButton onNavigate={onNavigate} />
          <h1 className="font-['Prata',serif] text-[28px] text-[#1a2e2d]">{t("settings_title")}</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-56 flex-shrink-0">
            <div className="bg-white rounded-[18px] shadow-sm p-2 md:sticky md:top-6">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] font-['Poppins',sans-serif] text-[13px] font-medium transition-all ${
                    activeTab === id ? "bg-[#089D97] text-white shadow-sm" : "text-[#5a8a87] hover:bg-[#f0f8f7] hover:text-[#1a2e2d]"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                  {activeTab !== id && <ChevronRight size={14} className="ml-auto opacity-40" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 bg-white rounded-[20px] shadow-sm p-6 md:p-8">
            {activeTab === "account" && (
              <Section title={t("settings_account")}>
                <InfoRow label={t("settings_account_type")} value={user?.role ?? "—"} capitalize />
                <InfoRow label={t("settings_email")} value={user?.email ?? "—"} />
                <InfoRow label={t("settings_member_since")} value={user?.joinDate ? new Date(user.joinDate).toLocaleDateString(locale, { month: "long", year: "numeric" }) : "—"} />
                <InfoRow label={t("settings_last_login")} value={t("profile_today")} />
                <Divider />
                <button onClick={() => onNavigate("user-profile")} className="w-full flex items-center justify-between px-4 py-3 rounded-[12px] bg-[#f0f8f7] hover:bg-[#e0f2f0] transition-colors font-['Poppins',sans-serif] text-[14px] text-[#1a2e2d] font-medium">
                  {t("settings_edit_profile")} <ChevronRight size={16} className="text-[#5a8a87]" />
                </button>
                <Divider />
                <button onClick={() => onNavigate("logout")} className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] bg-[#fff5f5] hover:bg-[#ffe8e8] transition-colors font-['Poppins',sans-serif] text-[14px] text-rose-600 font-medium">
                  <LogOut size={16} /> {t("settings_logout_btn")}
                </button>
              </Section>
            )}

            {activeTab === "appearance" && (
              <Section title={t("settings_appearance")}>
                <div className="flex items-center justify-between p-4 bg-[#f0f8f7] rounded-[14px]">
                  <div className="flex items-center gap-3">
                    {isDark ? <Moon size={20} className="text-[#089D97]" /> : <Sun size={20} className="text-amber-500" />}
                    <div>
                      <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#1a2e2d]">{t("settings_dark_mode")}</p>
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#5a8a87]">{t("settings_dark_mode_desc")}</p>
                    </div>
                  </div>
                  <Toggle enabled={isDark} onToggle={toggleTheme} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <ThemePreview label={t("theme_light")} active={!isDark} onClick={() => { if (isDark) toggleTheme(); }} />
                  <ThemePreview label={t("theme_dark")} active={isDark} onClick={() => { if (!isDark) toggleTheme(); }} dark />
                </div>
              </Section>
            )}

            {activeTab === "language" && (
              <Section title={t("settings_language")}>
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#5a8a87] mb-4">{t("language_desc")}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { code: "en", label: t("lang_english"), native: "English", flag: "🇺🇸" },
                    { code: "ar", label: t("lang_arabic"), native: "العربية", flag: "🇸🇦" },
                  ].map(({ code, label, native, flag }) => (
                    <button key={code} onClick={() => setLang(code as "en" | "ar")} className={`flex items-center gap-4 p-4 rounded-[14px] border-2 transition-all ${lang === code ? "border-[#089D97] bg-[#e0f2f0]" : "border-gray-200 bg-[#f9fffe] hover:border-[#bae0dd]"}`}>
                      <span className="text-3xl">{flag}</span>
                      <div className="text-start">
                        <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#1a2e2d]">{label}</p>
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#5a8a87]">{native}</p>
                      </div>
                      {lang === code && <CheckCircle size={18} className="ml-auto text-[#089D97]" />}
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {activeTab === "security" && (
              <Section title={t("settings_security")}>
                {user?.provider === "GOOGLE" ? (
                  <div className="p-4 bg-[#f0f8f7] rounded-[14px]">
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#1a2e2d]">This account signs in with Google, so local password changes are not available.</p>
                  </div>
                ) : (
                <div className="mb-6">
                  <h3 className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#1a2e2d] mb-3 flex items-center gap-2">
                    <Lock size={15} className="text-[#089D97]" /> {t("security_change_pw")}
                  </h3>
                  {pwSuccess && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-[12px] mb-3">
                      <CheckCircle size={16} className="text-green-600" />
                      <span className="font-['Poppins',sans-serif] text-[13px] text-green-700">{t("security_pw_success")}</span>
                    </div>
                  )}
                  {pwError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-[12px] mb-3">
                      <AlertTriangle size={16} className="text-red-600" />
                      <span className="font-['Poppins',sans-serif] text-[13px] text-red-700">{pwError}</span>
                    </div>
                  )}
                  <div className="space-y-3">
                    {[
                      { key: "current", placeholder: t("security_current_pw_ph") },
                      { key: "next", placeholder: t("security_new_pw_ph") },
                      { key: "confirm", placeholder: t("security_confirm_pw_ph") },
                    ].map(({ key, placeholder }) => (
                      <div key={key} className="relative">
                        <input
                          type={pwShow ? "text" : "password"}
                          value={pwForm[key as keyof typeof pwForm]}
                          onChange={(e) => setPwForm((f) => ({ ...f, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="w-full px-4 py-3 pr-12 rounded-[12px] bg-[#f0f8f7] border border-transparent focus:border-[#089D97] outline-none font-['Poppins',sans-serif] text-[14px] text-[#1a2e2d] placeholder-gray-400 transition-colors"
                        />
                        {key === "current" && (
                          <button onClick={() => setPwShow(!pwShow)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5a8a87]">
                            {pwShow ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        )}
                      </div>
                    ))}
                    <div className="flex flex-wrap items-center gap-3">
                      <button onClick={handlePasswordSave} disabled={!pwForm.current || !pwForm.next || pwForm.next !== pwForm.confirm} className="px-6 py-2.5 rounded-[12px] bg-[#089D97] text-white font-['Poppins',sans-serif] text-[13px] font-semibold hover:bg-[#047975] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        {t("security_update_pw")}
                      </button>
                      <button onClick={() => onNavigate("forgot-password")} className="px-4 py-2.5 rounded-[12px] bg-[#f0f8f7] text-[#047975] font-['Poppins',sans-serif] text-[13px] font-semibold hover:bg-[#e0f2f0] transition-colors">
                        {t("login_forgot")}
                      </button>
                    </div>
                  </div>
                </div>
                )}
              </Section>
            )}

            {activeTab === "help" && (
              <Section title={t("settings_help")}>
                <div className="space-y-3">
                  {[
                    { label: t("help_faq"), desc: t("help_faq_desc"), icon: HelpCircle },
                    { label: t("help_contact_label"), desc: t("help_contact_desc"), icon: ExternalLink },
                    { label: t("help_bug"), desc: t("help_bug_desc"), icon: AlertTriangle },
                  ].map(({ label, desc, icon: Icon }) => (
                    <button key={label} className="w-full flex items-center gap-4 p-4 rounded-[14px] bg-[#f0f8f7] hover:bg-[#e0f2f0] transition-colors text-start">
                      <div className="w-10 h-10 rounded-[12px] bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                        <Icon size={18} className="text-[#089D97]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-['Poppins',sans-serif] font-medium text-[14px] text-[#1a2e2d]">{label}</p>
                        <p className="font-['Poppins',sans-serif] text-[12px] text-[#5a8a87]">{desc}</p>
                      </div>
                      <ChevronRight size={16} className="text-[#5a8a87]" />
                    </button>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-[#e0f2f0] rounded-[14px] border border-[#bae0dd]">
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#047975] font-medium">{t("help_version")}</p>
                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#5a8a87]">{t("help_copyright")}</p>
                </div>
              </Section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-['Poppins',sans-serif] font-semibold text-[18px] text-[#1a2e2d] mb-5">{title}</h2>
      {children}
    </div>
  );
}

function InfoRow({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-[#f0f8f7] last:border-0">
      <span className="font-['Poppins',sans-serif] text-[13px] text-[#5a8a87]">{label}</span>
      <span className={`font-['Poppins',sans-serif] text-[13px] font-medium text-[#1a2e2d] ${capitalize ? "capitalize" : ""}`}>{value}</span>
    </div>
  );
}

function Divider() {
  return <hr className="border-[#f0f8f7] my-4" />;
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${enabled ? "bg-[#089D97]" : "bg-gray-300"}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

function ThemePreview({ label, active, onClick, dark }: { label: string; active: boolean; onClick: () => void; dark?: boolean }) {
  return (
    <button onClick={onClick} className={`p-4 rounded-[14px] border-2 transition-all text-left ${active ? "border-[#089D97]" : "border-gray-200 hover:border-[#bae0dd]"}`}>
      <div className={`w-full h-16 rounded-[10px] mb-3 overflow-hidden ${dark ? "bg-[#0f1f1e]" : "bg-[#f0f8f7]"}`}>
        <div className={`h-4 ${dark ? "bg-[#162a29]" : "bg-white"} mb-1.5`} />
        <div className={`mx-2 h-2 ${dark ? "bg-[#1e3a39]" : "bg-[#e0f2f0]"} rounded mb-1`} />
        <div className={`mx-2 h-2 w-3/4 ${dark ? "bg-[#1a3130]" : "bg-[#bae0dd]"} rounded`} />
      </div>
      <div className="flex items-center justify-between">
        <span className="font-['Poppins',sans-serif] text-[13px] font-medium text-[#1a2e2d]">{label}</span>
        {active && <CheckCircle size={15} className="text-[#089D97]" />}
      </div>
    </button>
  );
}
