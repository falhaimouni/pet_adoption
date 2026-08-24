import { useState } from "react";
import {
  User, Palette, Globe, Bell, Lock, Shield, HelpCircle,
  ChevronRight, Moon, Sun, Trash2, LogOut, Eye, EyeOff,
  CheckCircle, AlertTriangle, ExternalLink,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

interface SettingsPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

type SettingsTab = "account" | "appearance" | "language" | "notifications" | "privacy" | "security" | "help";

export default function SettingsPage({ onNavigate }: SettingsPageProps) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();

  const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: "account",       label: t("settings_account"),       icon: User },
    { id: "appearance",    label: t("settings_appearance"),    icon: Palette },
    { id: "language",      label: t("settings_language"),      icon: Globe },
    { id: "notifications", label: t("settings_notifications"), icon: Bell },
    { id: "privacy",       label: t("settings_privacy"),       icon: Eye },
    { id: "security",      label: t("settings_security"),      icon: Shield },
    { id: "help",          label: t("settings_help"),          icon: HelpCircle },
  ];
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [notifs, setNotifs] = useState({ email: true, adoption: true, order: true, promo: false, newPet: true });
  const [privacy, setPrivacy] = useState({ publicProfile: true, showPhone: false, showEmail: false });
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwShow, setPwShow] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [twoFa, setTwoFa] = useState(false);

  function handlePasswordSave() {
    if (pwForm.next.length < 6 || pwForm.next !== pwForm.confirm) return;
    setPwSuccess(true);
    setPwForm({ current: "", next: "", confirm: "" });
    setTimeout(() => setPwSuccess(false), 3000);
  }

  function handleDeleteAccount() {
    logout();
    onNavigate("home");
  }

  return (
    <div className="min-h-screen bg-[#f0f8f7]">
      <Navbar onNavigate={onNavigate} />
      <div className="max-w-5xl mx-auto px-5 py-8 pb-16">
        <h1 className="font-['Prata',serif] text-[28px] text-[#1a2e2d] mb-6">{t("settings_title")}</h1>

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
              <Section title="Account">
                <InfoRow label="Account Type" value={user?.role ?? "—"} capitalize />
                <InfoRow label="Email" value={user?.email ?? "—"} />
                <InfoRow label="Member Since" value={user?.joinDate ? new Date(user.joinDate).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"} />
                <InfoRow label="Last Login" value="Today" />
                <Divider />
                <button onClick={() => onNavigate("user-profile")} className="w-full flex items-center justify-between px-4 py-3 rounded-[12px] bg-[#f0f8f7] hover:bg-[#e0f2f0] transition-colors font-['Poppins',sans-serif] text-[14px] text-[#1a2e2d] font-medium">
                  Edit Profile <ChevronRight size={16} className="text-[#5a8a87]" />
                </button>
                <Divider />
                <button onClick={() => { logout(); onNavigate("home"); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] bg-[#fff5f5] hover:bg-[#ffe8e8] transition-colors font-['Poppins',sans-serif] text-[14px] text-rose-600 font-medium">
                  <LogOut size={16} /> Logout
                </button>
                <button onClick={() => setShowDeleteConfirm(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] bg-[#fff5f5] hover:bg-[#ffe8e8] transition-colors font-['Poppins',sans-serif] text-[14px] text-rose-600 font-medium mt-2">
                  <Trash2 size={16} /> Delete Account
                </button>
                {showDeleteConfirm && (
                  <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-[14px]">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertTriangle size={20} className="text-rose-500 mt-0.5 flex-shrink-0" />
                      <p className="font-['Poppins',sans-serif] text-[13px] text-[#1a2e2d]">Are you sure? This action cannot be undone and will permanently delete all your data.</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={handleDeleteAccount} className="flex-1 py-2.5 rounded-[10px] bg-rose-600 text-white font-['Poppins',sans-serif] text-[13px] font-semibold hover:bg-rose-700 transition-colors">Delete Forever</button>
                      <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 rounded-[10px] bg-white border border-gray-200 text-[#1a2e2d] font-['Poppins',sans-serif] text-[13px] font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
                    </div>
                  </div>
                )}
              </Section>
            )}

            {activeTab === "appearance" && (
              <Section title="Appearance">
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
                  <ThemePreview label="Light" active={!isDark} onClick={() => { if (isDark) toggleTheme(); }} />
                  <ThemePreview label="Dark" active={isDark} onClick={() => { if (!isDark) toggleTheme(); }} dark />
                </div>
              </Section>
            )}

            {activeTab === "language" && (
              <Section title="Language">
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#5a8a87] mb-4">Choose your preferred language. Arabic uses a right-to-left layout.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { code: "en", label: "English", native: "English", flag: "🇺🇸" },
                    { code: "ar", label: "Arabic", native: "العربية", flag: "🇸🇦" },
                  ].map(({ code, label, native, flag }) => (
                    <button key={code} onClick={() => setLang(code as "en" | "ar")} className={`flex items-center gap-4 p-4 rounded-[14px] border-2 transition-all ${lang === code ? "border-[#089D97] bg-[#e0f2f0]" : "border-gray-200 bg-[#f9fffe] hover:border-[#bae0dd]"}`}>
                      <span className="text-3xl">{flag}</span>
                      <div className="text-left">
                        <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#1a2e2d]">{label}</p>
                        <p className="font-['Poppins',sans-serif] text-[13px] text-[#5a8a87]">{native}</p>
                      </div>
                      {lang === code && <CheckCircle size={18} className="ml-auto text-[#089D97]" />}
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {activeTab === "notifications" && (
              <Section title="Notifications">
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#5a8a87] mb-5">Control what notifications you receive.</p>
                <div className="space-y-3">
                  {[
                    { key: "email", label: "Email Notifications", desc: "Receive emails from Petopia" },
                    { key: "adoption", label: "Adoption Updates", desc: "Status changes on your adoption requests" },
                    { key: "order", label: "Order Updates", desc: "Shipping and delivery notifications" },
                    { key: "promo", label: "Promotions & Offers", desc: "Discounts, deals, and special offers" },
                    { key: "newPet", label: "New Pet Alerts", desc: "When pets matching your preferences are listed" },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between p-4 rounded-[14px] bg-[#f0f8f7]">
                      <div>
                        <p className="font-['Poppins',sans-serif] font-medium text-[14px] text-[#1a2e2d]">{label}</p>
                        <p className="font-['Poppins',sans-serif] text-[12px] text-[#5a8a87]">{desc}</p>
                      </div>
                      <Toggle enabled={notifs[key as keyof typeof notifs]} onToggle={() => setNotifs((n) => ({ ...n, [key]: !n[key as keyof typeof notifs] }))} />
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {activeTab === "privacy" && (
              <Section title="Privacy">
                <div className="space-y-3">
                  {[
                    { key: "publicProfile", label: "Public Profile", desc: "Other users can see your profile" },
                    { key: "showPhone", label: "Show Phone Number", desc: "Display your phone on your public profile" },
                    { key: "showEmail", label: "Show Email", desc: "Display your email on your public profile" },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between p-4 rounded-[14px] bg-[#f0f8f7]">
                      <div>
                        <p className="font-['Poppins',sans-serif] font-medium text-[14px] text-[#1a2e2d]">{label}</p>
                        <p className="font-['Poppins',sans-serif] text-[12px] text-[#5a8a87]">{desc}</p>
                      </div>
                      <Toggle enabled={privacy[key as keyof typeof privacy]} onToggle={() => setPrivacy((p) => ({ ...p, [key]: !p[key as keyof typeof privacy] }))} />
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {activeTab === "security" && (
              <Section title="Security">
                <div className="mb-6">
                  <h3 className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#1a2e2d] mb-3 flex items-center gap-2">
                    <Lock size={15} className="text-[#089D97]" /> Change Password
                  </h3>
                  {pwSuccess && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-[12px] mb-3">
                      <CheckCircle size={16} className="text-green-600" />
                      <span className="font-['Poppins',sans-serif] text-[13px] text-green-700">Password updated successfully!</span>
                    </div>
                  )}
                  <div className="space-y-3">
                    {[
                      { key: "current", placeholder: "Current password" },
                      { key: "next", placeholder: "New password" },
                      { key: "confirm", placeholder: "Confirm new password" },
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
                    <button onClick={handlePasswordSave} disabled={!pwForm.current || !pwForm.next || pwForm.next !== pwForm.confirm} className="px-6 py-2.5 rounded-[12px] bg-[#089D97] text-white font-['Poppins',sans-serif] text-[13px] font-semibold hover:bg-[#047975] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                      Update Password
                    </button>
                  </div>
                </div>
                <Divider />
                <div className="mt-6 mb-6">
                  <div className="flex items-center justify-between p-4 rounded-[14px] bg-[#f0f8f7]">
                    <div>
                      <p className="font-['Poppins',sans-serif] font-medium text-[14px] text-[#1a2e2d]">Two-Factor Authentication</p>
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#5a8a87]">Add an extra layer of security to your account</p>
                    </div>
                    <Toggle enabled={twoFa} onToggle={() => setTwoFa(!twoFa)} />
                  </div>
                </div>
                <Divider />
                <div className="mt-6">
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] bg-[#fff5f5] hover:bg-[#ffe8e8] transition-colors font-['Poppins',sans-serif] text-[14px] text-rose-600 font-medium">
                    <LogOut size={16} /> Logout from All Devices
                  </button>
                </div>
              </Section>
            )}

            {activeTab === "help" && (
              <Section title="Help & Support">
                <div className="space-y-3">
                  {[
                    { label: "Frequently Asked Questions", desc: "Find answers to common questions", icon: HelpCircle },
                    { label: "Contact Support", desc: "Get help from our team", icon: ExternalLink },
                    { label: "Report a Bug", desc: "Let us know about any issues", icon: AlertTriangle },
                  ].map(({ label, desc, icon: Icon }) => (
                    <button key={label} className="w-full flex items-center gap-4 p-4 rounded-[14px] bg-[#f0f8f7] hover:bg-[#e0f2f0] transition-colors text-left">
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
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#047975] font-medium">Version 1.0.0</p>
                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#5a8a87]">Petopia · All rights reserved © 2024</p>
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
