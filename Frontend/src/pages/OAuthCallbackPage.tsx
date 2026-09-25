import { useText } from "../i18n/useText";
import { useEffect, useRef, useState } from "react";
import { useAuth, type UserRole } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

interface OAuthCallbackPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
  code?: string;
}

function pageForRole(role: UserRole): string {
  switch (role) {
    case "admin": return "admin-dashboard";
    case "manager": return "manager-dashboard";
    case "employee": return "staff-dashboard";
    case "vet": return "vet-dashboard";
    default: return "pets";
  }
}

export default function OAuthCallbackPage({ onNavigate, code }: OAuthCallbackPageProps) {
  const tx = useText();
  const { completeGoogleLogin, returnTo, setReturnTo } = useAuth();
  const { t } = useLanguage();
  const [error, setError] = useState("");
  const attemptedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    if (attemptedRef.current) return;
    attemptedRef.current = true;

    async function completeLogin() {
      if (!code) {
        setError(tx("Google sign-in did not provide a valid session."));
        return;
      }

      try {
        const user = await completeGoogleLogin(code);
        if (cancelled) return;
        const target = returnTo ?? pageForRole(user.role);
        setReturnTo(null);
        onNavigate(target);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : tx("Google sign-in failed."));
        }
      }
    }

    void completeLogin();

    return () => {
      cancelled = true;
    };
  }, [code, completeGoogleLogin, onNavigate, returnTo, setReturnTo]);

  return (
    <div className="min-h-screen bg-[#f0f8f7] flex items-center justify-center px-4 font-['Poppins',sans-serif]">
      <div className="w-full max-w-sm bg-white rounded-[15px] shadow-md p-5 text-center">
        <p className="text-[#089D97] font-semibold">
          {error ? t("oauth_google_failed") : t("oauth_google_completing")}
        </p>
        {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}
        {error && (
          <button
            type="button"
            onClick={() => onNavigate("login")}
            className="mt-4 px-4 py-2 bg-[#089D97] text-white rounded-[10px] text-[13px] font-medium"
          >
            {t("forgot_back")}
          </button>
        )}
      </div>
    </div>
  );
}
