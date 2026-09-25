import { useText } from "../i18n/useText";
import { useState } from "react";
import Navbar from "../components/Navbar";
import { apiFetch } from "../lib/api";
import { isEmail } from "../lib/validation";
import { useLanguage } from "../context/LanguageContext";

interface Props {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
  token?: string;
  email?: string;
}

export default function VerifyEmailPage({ onNavigate, token, email = "" }: Props) {
  const tx = useText();
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await apiFetch(token ? "/auth/verify-email" : "/auth/resend-verification", {
        method: "POST", body: JSON.stringify(token ? { token } : { email }),
      });
      setVerified(Boolean(token));
      setMessage(t(token ? "verify_success" : "verify_sent"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("verify_error"));
    } finally {
      setBusy(false);
    }
  }

  return <div className="min-h-screen bg-[#f0f8f7]">
    <Navbar onNavigate={onNavigate} />
    <main className="max-w-md mx-auto px-5 py-16">
      <div className="bg-white rounded-[24px] shadow-sm p-8 flex flex-col gap-4">
        <h1 className="text-3xl text-[#1a2e2d]">{t("verify_title")}</h1>
        <p>{t(token ? "verify_link_desc" : "verify_desc")}</p>
        {email && <p className="break-all">{email}</p>}
        {message && <p role="status" className="text-emerald-700">{message}</p>}
        {error && <p role="alert" className="text-red-600">{error}</p>}
        {!verified && <button disabled={busy || (!token && !isEmail(email))} onClick={submit} className="bg-[#089D97] text-white py-3 rounded-xl disabled:opacity-50">
          {busy ? t("forgot_sending") : t(token ? "verify_button" : "verify_resend")}
        </button>}
        <button onClick={() => onNavigate("login")} className="text-[#047975]">{t("forgot_back")}</button>
      </div>
    </main>
  </div>;
}
