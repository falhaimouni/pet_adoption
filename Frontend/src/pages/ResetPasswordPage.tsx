import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import Navbar from "../components/Navbar";
import InputField from "../components/InputField";
import { apiFetch } from "../lib/api";
import { isStrongPassword } from "../lib/validation";
import { useLanguage } from "../context/LanguageContext";

interface ResetPasswordPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
  token?: string;
}

export default function ResetPasswordPage({ onNavigate, token }: ResetPasswordPageProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(token ? "" : t("reset_missing_token"));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setEmail("");
    if (token) {
      apiFetch<{ email: string }>("/auth/reset-password-context", {
        method: "POST", body: JSON.stringify({ token }),
      }).then(result => { if (!cancelled) setEmail(result.email); })
        .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : t("reset_error")); });
    }
    return () => { cancelled = true; };
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!token || !email) {
      setError(t("reset_missing_token"));
      return;
    }
    if (!isStrongPassword(newPassword)) {
      setError(t("reset_password_rules_error"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("signup_password_mismatch"));
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      });
      setMessage(res.message);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("reset_error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f8f7]">
      <Navbar onNavigate={onNavigate} />
      <main className="max-w-md mx-auto px-5 py-16">
        <div className="bg-white rounded-[24px] shadow-sm p-8">
          <h1 className="font-['Prata',serif] text-[30px] text-[#1a2e2d] mb-2">{t("reset_title")}</h1>
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#5a8a87] mb-6">
            {t("reset_desc")}
          </p>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <InputField label={t("login_email")} placeholder="" type="email" value={email} readOnly />
            <InputField label={t("security_new_pw_ph")} placeholder={t("security_new_pw_ph")} type="password" icon={<Lock size={18} />} value={newPassword} onChange={setNewPassword} />
            <InputField label={t("signup_confirm_password")} placeholder={t("security_confirm_pw_ph")} type="password" icon={<Lock size={18} />} value={confirmPassword} onChange={setConfirmPassword} />
            {message && <p className="font-['Poppins',sans-serif] text-[13px] text-emerald-700 bg-emerald-50 rounded-[12px] px-4 py-3">{message}</p>}
            {error && <p role="alert" className="whitespace-pre-line font-['Poppins',sans-serif] text-[13px] text-red-600 bg-red-50 rounded-[12px] px-4 py-3">{error}</p>}
            <button disabled={loading || !email || Boolean(message)} className="w-full bg-[#089D97] text-white font-['Poppins',sans-serif] font-semibold text-[15px] py-3 rounded-[14px] hover:bg-[#047975] transition-colors disabled:opacity-60">
              {loading ? t("reset_loading") : t("reset_button")}
            </button>
            <button type="button" onClick={() => onNavigate("login")} className="font-['Poppins',sans-serif] text-[13px] text-[#089D97] hover:underline">
              {t("forgot_back")}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
