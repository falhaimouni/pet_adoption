import { useState } from "react";
import { Mail } from "lucide-react";
import Navbar from "../components/Navbar";
import InputField from "../components/InputField";
import { apiFetch } from "../lib/api";
import { useLanguage } from "../context/LanguageContext";
import { isEmail } from "../lib/validation";

interface ForgotPasswordPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

export default function ForgotPasswordPage({ onNavigate }: ForgotPasswordPageProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    if (!isEmail(email.trim())) {
      setError(t("error_valid_email"));
      return;
    }
    setLoading(true);
    try {
      await apiFetch<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      setMessage(t("forgot_success_message"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("forgot_error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f8f7]">
      <Navbar onNavigate={onNavigate} />
      <main className="max-w-md mx-auto px-5 py-16">
        <div className="bg-white rounded-[24px] shadow-sm p-8">
          <h1 className="font-['Prata',serif] text-[30px] text-[#1a2e2d] mb-2">{t("forgot_title")}</h1>
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#5a8a87] mb-6">{t("forgot_desc")}</p>
          {message ? (
            <div className="flex flex-col gap-4">
              <p className="font-['Poppins',sans-serif] text-[13px] text-emerald-700 bg-emerald-50 rounded-[12px] px-4 py-3">{message}</p>
              <p className="font-['Poppins',sans-serif] text-[13px] text-[#5a8a87]">{t("forgot_check_email")}</p>
              <button type="button" onClick={() => onNavigate("login")} className="w-full bg-[#089D97] text-white font-['Poppins',sans-serif] font-semibold text-[15px] py-3 rounded-[14px] hover:bg-[#047975] transition-colors">
                {t("forgot_back")}
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-4">
              <InputField label={t("login_email")} placeholder="you@example.com" type="email" icon={<Mail size={18} />} value={email} onChange={setEmail} />
              {error && <p role="alert" className="whitespace-pre-line font-['Poppins',sans-serif] text-[13px] text-red-600 bg-red-50 rounded-[12px] px-4 py-3">{error}</p>}
              <button disabled={loading} className="w-full bg-[#089D97] text-white font-['Poppins',sans-serif] font-semibold text-[15px] py-3 rounded-[14px] hover:bg-[#047975] transition-colors disabled:opacity-60">
                {loading ? t("forgot_sending") : t("forgot_send")}
              </button>
              <button type="button" onClick={() => onNavigate("login")} className="font-['Poppins',sans-serif] text-[13px] text-[#089D97] hover:underline">
                {t("forgot_back")}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
