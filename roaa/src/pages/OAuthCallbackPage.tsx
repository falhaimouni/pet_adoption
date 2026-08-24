import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader } from "lucide-react";

type OAuthProvider = "google" | "github";
type Status = "loading" | "success" | "error";

interface OAuthCallbackPageProps {
  provider?: OAuthProvider;
  onNavigate: (page: string) => void;
}

export default function OAuthCallbackPage({ provider = "google", onNavigate }: OAuthCallbackPageProps) {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const t = setTimeout(() => {
      setStatus("success");
      setTimeout(() => onNavigate("pets"), 1200);
    }, 1800);
    return () => clearTimeout(t);
  }, []);

  const providerLabel = provider === "google" ? "Google" : "GitHub";
  const providerColor = provider === "google" ? "text-red-500" : "text-gray-800";

  return (
    <div className="min-h-screen bg-[rgba(186,216,211,0.99)] flex items-center justify-center">
      <div className="bg-white rounded-[20px] shadow-xl px-10 py-12 text-center max-w-sm w-full mx-4">
        {/* Logo */}
        <p className="font-['Prata',serif] text-[28px] text-[#089D97] mb-6">Petopia</p>

        {status === "loading" && (
          <>
            <div className="w-14 h-14 rounded-full bg-[rgba(8,157,151,0.1)] flex items-center justify-center mx-auto mb-4">
              <Loader size={24} className="text-[#089D97] animate-spin" />
            </div>
            <p className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black mb-1">Signing you in</p>
            <p className="font-['Poppins',sans-serif] text-[13px] text-black/50">Connecting with <span className={`font-semibold ${providerColor}`}>{providerLabel}</span>…</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-green-500" />
            </div>
            <p className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black mb-1">Welcome back!</p>
            <p className="font-['Poppins',sans-serif] text-[13px] text-black/50">Signed in with <span className={`font-semibold ${providerColor}`}>{providerLabel}</span>. Redirecting…</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <XCircle size={28} className="text-red-400" />
            </div>
            <p className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black mb-1">Authentication failed</p>
            <p className="font-['Poppins',sans-serif] text-[13px] text-black/50 mb-5">Could not sign in with {providerLabel}. Please try again.</p>
            <button onClick={() => onNavigate("login")} className="w-full py-2.5 bg-[#089D97] text-white font-['Poppins',sans-serif] font-medium text-[14px] rounded-[10px] hover:bg-[#047975] transition-colors">Back to Login</button>
          </>
        )}
      </div>
    </div>
  );
}
