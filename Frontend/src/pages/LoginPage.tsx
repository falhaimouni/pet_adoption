import { useState } from "react";
import { User, Lock } from "lucide-react";
import InputField from "../components/InputField";
import dogImg from "../imports/Login/69b6e36eb99058fdf605168f149a065c8e920c01.png";
import smallDogImg from "../imports/Login/802360a33575269f1c4bd4c214efd91fa36b93bf.png";
import catPhotoImg from "../imports/Login/9bd62fd6b651515e439f303dbe7dcc8978ef5b6a.png";
import pawLeafImg from "../imports/Login/c5ef6e7fef83234c87222ba3003b9cd587a39b1f.png";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { useLanguage } from "../context/LanguageContext";
import { API_BASE_URL } from "../lib/api";

interface LoginPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

function pageForRole(role: UserRole): string {
  switch (role) {
    case "admin":   return "admin-dashboard";
    case "manager": return "manager-dashboard";
    case "staff":   return "staff-dashboard";
    case "vet":     return "vet-dashboard";
    default:        return "pets";
  }
}

export default function LoginPage({ onNavigate }: LoginPageProps) {
  const { login, returnTo, setReturnTo } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError(t("error_missing_login"));
      return;
    }
    setLoading(true);
    let loggedInUser: Awaited<ReturnType<typeof login>>;
    try {
      loggedInUser = await login(email.trim().toLowerCase(), password);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : t("error_backend_connect"));
      return;
    }
    setLoading(false);
    if (!loggedInUser) {
      setError(t("error_invalid_credentials"));
      return;
    }
    if (returnTo) {
      const target = returnTo;
      setReturnTo(null);
      onNavigate(target);
      return;
    }
    onNavigate(pageForRole(loggedInUser.role));
  };

  const handleGoogleLogin = () => {
    setError("");
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen bg-[rgba(186,216,211,0.99)] flex flex-col overflow-x-hidden">
      <Navbar onNavigate={onNavigate} />

      {/* Match the sign-up page: stack on small screens and use two fluid columns from md up. */}
      <div className="relative flex flex-col md:flex-row flex-1 md:min-h-0 overflow-x-hidden pb-[70px] md:pb-[56px]">

        {/* ── Left Panel ── */}
        <div className="relative flex-1 flex flex-col items-start overflow-hidden px-6 sm:px-8 md:px-0 py-8 sm:py-10 md:py-0 min-h-[360px] md:min-h-[620px]">

          {/* One grouped hero: background shape, copy, and dog move together. */}
          <div className="relative w-full max-w-[620px] md:max-w-[34vw] md:ml-[5vw] md:mr-auto md:mt-[8vw]">
            <svg viewBox="0 0 600 600" fill="none" className="absolute w-[min(100%,600px)] md:w-[42vw] h-auto top-[70px] md:top-[2vw] left-1/2 -translate-x-1/2 pointer-events-none">
              <circle cx="300" cy="300" r="300" fill="#089D97" fillOpacity="0.15" />
            </svg>

          {/* Brand text block — positioned at top-left */}
          <div className="relative z-10 flex w-full flex-col items-start">
            <h2 className="font-['Prata',serif] text-[34px] sm:text-[40px] md:text-[3vw] text-[#047975] leading-tight mb-0">
              Petopia
            </h2>
          </div>

          {/* Welcome section — positioned left-center */}
          <div className="relative z-10 flex w-full max-w-[420px] flex-col items-start mt-8 sm:mt-10">
            <p className="font-['Poppins',sans-serif] font-semibold text-[28px] sm:text-[32px] md:text-[3.5vw] text-black rotate-[-0.7deg] mb-2 leading-tight">
              {t("login_welcome_to")}
            </p>
            <p className="font-['Poppins',sans-serif] text-[16px] md:text-[1.4vw] text-black max-w-[300px] md:max-w-[24vw] leading-snug">
              {t("home_hero_desc1")}
            </p>
          </div>

          {/* Dog illustration */}
          <div className="relative z-10 flex w-full justify-center mt-6 sm:mt-8">
            <img
              src={dogImg}
              alt=""
              className="w-[min(78vw,280px)] md:w-[min(36vw,500px)] h-auto object-contain"
            />
          </div>
          {/* Tagline card */}
          <div className="relative z-20 self-end ml-auto -mt-16 sm:-mt-20 bg-[rgba(186,216,211,0.96)] border border-white rounded-[30px] shadow-[7px_7px_1px_0px_rgba(0,0,0,0.25)] px-5 py-4 max-w-[260px]">
              <p className="font-['Poppins',sans-serif] text-[14px] text-black leading-relaxed">
              {t("login_quote")}
            </p>
          </div>
          </div>

          {/* Paw leaf — bottom-left */}
          <img
            src={pawLeafImg}
            alt=""
            className="absolute bottom-[5%] left-[5%] w-[clamp(70px,10vw,140px)] h-auto pointer-events-none hidden lg:block"
          />
        </div>

        {/* ── Right Panel ── */}
        <div className="relative flex-1 md:min-h-[620px] flex items-center justify-center px-4 sm:px-6 md:px-10 py-8 md:py-10">
          <div className="w-full max-w-[500px] md:w-[31vw] md:max-w-none relative mt-6 md:mt-[2vw] bg-white rounded-[24px] sm:rounded-[30px] shadow-xl px-5 py-5 sm:px-8 sm:py-8 md:px-[2.1vw] md:py-[1.2vw]">
            {/* Cat at the top of the card */}
            <div className="absolute -top-[55px] left-0">
              <img
                src={catPhotoImg}
                alt=""
                className="w-[180px] h-auto object-contain"
              />
            </div>
            
            <h2 className="font-['Inter',sans-serif] font-semibold text-[26px] sm:text-[32px] text-black mb-1">
              {t("login_welcome_back")}
            </h2>
            <p className="font-['Inter',sans-serif] font-light text-[18px] text-black mb-8">
              {t("login_subtitle")}
            </p>

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <InputField
                label={t("login_email")}
                placeholder={t("login_enter_email")}
                type="email"
                icon={<User size={18} />}
              value={email}
              onChange={setEmail}
              responsive
              />
              <InputField
                label={t("login_password")}
                placeholder={t("login_enter_password")}
                type="password"
                icon={<Lock size={18} />}
              value={password}
              onChange={setPassword}
              responsive
              />

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => onNavigate("forgot-password")}
                  className="font-['Inter',sans-serif] text-[15px] text-[rgba(8,157,151,0.99)] hover:underline"
                >
                  {t("login_forgot")}
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-[12px] px-4 py-3">
                  <p className="font-['Poppins',sans-serif] text-[13px] text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#089D97] text-white font-['Inter',sans-serif] font-bold text-[22px] py-4 rounded-[20px] hover:bg-[#047975] transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? t("login_signing_in") : t("login_btn")}
              </button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="h-px bg-gray-200 flex-1" />
              <span className="font-['Inter',sans-serif] text-[13px] text-black/40">{t("login_or")}</span>
              <div className="h-px bg-gray-200 flex-1" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full border border-gray-200 bg-white text-black font-['Inter',sans-serif] font-semibold text-[15px] py-3 rounded-[16px] hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              {t("auth_continue_google")}
            </button>

            <p className="text-center mt-6 font-['Inter',sans-serif] text-[15px] text-black">
              {t("login_no_account")}{" "}
              <button
                onClick={() => onNavigate("signup")}
                className="text-[#047975] font-semibold hover:underline"
              >
                {t("login_signup")}
              </button>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
