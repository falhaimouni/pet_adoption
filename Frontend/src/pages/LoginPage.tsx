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

      {/* Fluid px layout: stacks on mobile/tablet, 2 cols on desktop. No vw so zoom stays stable. */}
      <div className="w-full max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-6 items-center lg:items-center flex-1 px-4 sm:px-6 lg:px-10 py-8 sm:py-10">

        {/* ── Left Panel ── */}
        <div className="relative flex justify-center lg:justify-start">

          {/* One grouped hero: background shape, copy, and dog move together. */}
          <div className="relative w-full max-w-[340px] sm:max-w-[440px] lg:max-w-[540px] mx-auto lg:mx-0">
            <svg viewBox="0 0 600 600" fill="none" className="absolute w-full max-w-[560px] h-auto top-[30px] sm:top-[40px] left-1/2 -translate-x-1/2 pointer-events-none" aria-hidden="true">
              <circle cx="300" cy="300" r="300" fill="#089D97" fillOpacity="0.15" />
            </svg>

          {/* Brand text block — positioned at top-left */}
          <div className="relative z-10 w-full">
            <h2 className="font-['Prata',serif] text-[32px] sm:text-[36px] lg:text-[40px] text-[#047975] leading-tight">
              Petopia
            </h2>
          </div>

          {/* Welcome section — positioned left-center */}
          <div className="relative z-10 w-full max-w-[420px] mt-5 sm:mt-8">
            <p className="font-['Poppins',sans-serif] font-semibold text-[32px] sm:text-[40px] lg:text-[44px] text-black leading-[1.1] text-balance break-words">
              {t("login_welcome_to")}
            </p>
            <p className="font-['Poppins',sans-serif] text-[15px] sm:text-base lg:text-[17px] text-black max-w-[400px] leading-[1.6] mt-3 text-balance break-words">
              {t("home_hero_desc1")}
            </p>
          </div>

          {/* Dog + tagline move as one unit, dog stays anchored under the copy */}
          <div className="relative z-10 w-full mt-4">
            <img
              src={dogImg}
              alt=""
              className="w-[240px] sm:w-[300px] lg:w-[340px] h-auto object-contain mx-auto lg:mx-0"
            />
            {/* Tagline card: stacked under dog on phones, overlapping on sm+ */}
            <div className="relative mt-3 mx-auto sm:mx-0 sm:absolute sm:mt-0 sm:bottom-[20px] lg:bottom-[28px] sm:left-[190px] lg:left-[240px] bg-[rgba(186,216,211,0.96)] border border-white rounded-[20px] lg:rounded-[24px] shadow-[7px_7px_1px_0px_rgba(0,0,0,0.25)] px-4 sm:px-5 py-3 sm:py-3.5 w-full max-w-[230px] sm:w-[250px] sm:max-w-none">
              <p className="font-['Poppins',sans-serif] text-[13px] sm:text-[14px] text-black leading-relaxed text-center sm:text-left">
                {t("login_quote")}
              </p>
            </div>
          </div>
          </div>

          {/* Paw leaf — bottom-left */}
          <img
            src={pawLeafImg}
            alt=""
            className="absolute bottom-[2%] left-[2%] w-[90px] lg:w-[120px] h-auto pointer-events-none hidden md:block"
          />
        </div>

        {/* ── Right Panel ── */}
        <div className="relative flex justify-center lg:justify-end items-start py-4 sm:py-6">
          <div className="w-full max-w-[440px] sm:max-w-[500px] lg:max-w-[520px] relative mt-12 sm:mt-[56px] bg-white rounded-[20px] sm:rounded-[30px] shadow-xl px-5 sm:px-8 py-6 sm:py-8">
            {/* Cat at the top of the card — fixed size, fixed offset so it never drifts */}
            <div className="absolute -top-[36px] sm:-top-[52px] left-[8px] pointer-events-none">
              <img
                src={catPhotoImg}
                alt=""
                className="w-[120px] sm:w-[150px] lg:w-[170px] h-auto object-contain"
              />
            </div>
            
            <h2 className="font-['Inter',sans-serif] font-semibold text-[22px] sm:text-[26px] lg:text-[32px] text-black mb-1 text-balance">
              {t("login_welcome_back")}
            </h2>
            <p className="font-['Inter',sans-serif] font-light text-[16px] sm:text-[18px] text-black mb-6 sm:mb-8 text-balance">
              {t("login_subtitle")}
            </p>

            <form onSubmit={handleLogin} className="flex flex-col gap-4 sm:gap-5">
              <InputField
                label={t("login_email")}
                placeholder={t("login_enter_email")}
                type="email"
                icon={<User size={18} />}
              value={email}
              onChange={setEmail}
              />
              <InputField
                label={t("login_password")}
                placeholder={t("login_enter_password")}
                type="password"
                icon={<Lock size={18} />}
              value={password}
              onChange={setPassword}
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
                className="w-full bg-[#089D97] text-white font-['Inter',sans-serif] font-bold text-[18px] sm:text-[20px] lg:text-[22px] py-3 sm:py-4 rounded-[16px] sm:rounded-[20px] hover:bg-[#047975] transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
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
