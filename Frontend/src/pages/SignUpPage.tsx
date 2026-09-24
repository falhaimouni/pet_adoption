import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { User, Lock, Mail, PawPrint } from "lucide-react";
import InputField from "../components/InputField";
import Navbar from "../components/Navbar";
import tanBunnyImg from "../imports/SignUp/462532442e400e61d6592bda9436532a884ac924.png";
import grayBunnyImg from "../imports/SignUp/837dd37472b653b75b172453adc068d3edf2a940.png";
import catPhotoImg from "../imports/SignUp/34fffaeeed62376fd4622534a964d6760ea2fa50.png";
import { apiFetch, API_BASE_URL } from "../lib/api";
import { isEmail, isStrongPassword } from "../lib/validation";

interface SignUpPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

export default function SignUpPage({ onNavigate }: SignUpPageProps) {
  const { t } = useLanguage();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length < 2) {
      setError(t("signup_need_full_name"));
      return;
    }
    if (parts[0].length > 80 || lastNamePartsTooLong(parts)) {
      setError(t("signup_name_length_error"));
      return;
    }
    if (!isEmail(email.trim())) {
      setError(t("signup_invalid_email"));
      return;
    }
    if (!isStrongPassword(password)) {
      setError(t("reset_password_rules_error"));
      return;
    }
    if (!agreedToTerms) {
      setError(t("signup_need_terms"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("signup_password_mismatch"));
      return;
    }

    const [firstName, ...lastNameParts] = parts;
    setLoading(true);
    try {
      await apiFetch("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          firstName,
          lastName: lastNameParts.join(" "),
          email: email.trim().toLowerCase(),
          password,
          confirmPassword,
        }),
      });
      onNavigate("verify-email", { email: email.trim().toLowerCase() });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("signup_create_error"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    setError("");
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen bg-[rgba(186,216,211,0.99)] flex flex-col relative overflow-x-hidden">
      <Navbar onNavigate={onNavigate} />
      {/* Fluid px layout: stacks on mobile/tablet, 2 cols on desktop. No vw so zoom stays stable — same as login. */}
      <div className="w-full max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-6 items-center flex-1 px-4 sm:px-6 lg:px-10 py-8 sm:py-10">

      {/* ── Left Panel ── */}
      <div className="relative flex justify-center lg:justify-start min-h-[420px] sm:min-h-[480px] lg:min-h-[560px]">

        {/* One illustration group: the rabbits stay attached to their background shape. */}
        <div className="relative w-full max-w-[340px] sm:max-w-[440px] lg:max-w-[540px] mx-auto lg:mx-0">
          <div className="relative w-full max-w-[520px] h-[420px] sm:h-[500px] lg:h-[560px] bg-[#089D97]/25 [border-radius:58%_42%_55%_45%/48%_56%_44%_52%] pointer-events-none">
            <div className="absolute z-10 bottom-0 left-[6%] flex items-end">
              <img
                src={tanBunnyImg}
                alt={t("signup_brown_rabbit_alt")}
                className="w-[150px] sm:w-[180px] lg:w-[210px] h-auto object-contain"
              />
              <img
                src={grayBunnyImg}
                alt={t("signup_gray_rabbit_alt")}
                className="w-[125px] sm:w-[150px] lg:w-[175px] h-auto object-contain -ml-8 sm:-ml-12 translate-y-[6px]"
              />
            </div>
          </div>

          {/* Paw prints scattered */}
          <PawPrint size={28} className="absolute top-[18%] right-[12%] text-white/70 rotate-12 pointer-events-none" fill="currentColor" />
          <PawPrint size={22} className="absolute bottom-[16%] left-[46%] text-[#089D97]/60 rotate-12 pointer-events-none" fill="currentColor" />
          <PawPrint size={34} className="absolute bottom-[6%] left-[8%] text-white/80 -rotate-12 pointer-events-none hidden sm:block" fill="currentColor" />

        {/* Join Petopia section — stepped px type per breakpoint so zoom scales uniformly */}
        <div className="absolute top-[40px] sm:top-[56px] lg:top-[64px] left-[16px] sm:left-[24px] right-[16px] sm:right-auto z-10 flex flex-col items-start w-auto sm:w-full sm:max-w-[420px]">
          <p className="font-['Poppins',sans-serif] font-semibold text-[32px] sm:text-[40px] lg:text-[44px] text-black leading-[1.1] flex items-center gap-2 sm:gap-3 flex-wrap text-balance break-words">
            {t("signup_tagline")}{" "}
            <span className="font-['Prata',serif] font-normal text-[#047975] text-[30px] sm:text-[36px] lg:text-[40px] leading-none">Petopia</span>
            <PawPrint size={26} className="text-[#089D97]/50 -rotate-12" fill="currentColor" />
          </p>
          <p className="font-['Poppins',sans-serif] text-[15px] sm:text-base lg:text-[17px] text-black max-w-[400px] leading-[1.6] mt-3 text-balance break-words">
            {t("signup_subtitle")}
          </p>
        </div>

        </div>
      </div>

      {/* ── Right Panel (white card) ── */}
      <div className="relative flex justify-center lg:justify-end items-start py-4 sm:py-6 pr-14 sm:pr-[100px] lg:pr-[112px]">
        <div className="w-full max-w-[440px] sm:max-w-[500px] lg:max-w-[520px] relative mt-[24px]">
        <div className="relative z-10 bg-white rounded-[20px] sm:rounded-[30px] shadow-xl px-5 sm:px-8 py-6 sm:py-8 overflow-visible">
          {/* The cat is part of the card, so it stays aligned with its border at every zoom level. */}
          <img
            src={catPhotoImg}
            alt=""
            className="absolute top-[120px] sm:top-[150px] -right-[64px] sm:-right-[100px] lg:-right-[120px] w-[140px] sm:w-[175px] lg:w-[200px] h-auto object-contain pointer-events-none hidden sm:block z-20 rotate-90"
          />
          <h2 className="font-['Inter',sans-serif] font-semibold text-[22px] sm:text-[26px] lg:text-[28px] text-black mb-1 text-center text-balance">{t("signup_title")}</h2>
          <p className="font-['Inter',sans-serif] font-light text-[14px] sm:text-[15px] text-black mb-4 text-center text-balance">
            {t("signup_subtitle2")}
          </p>

          <form onSubmit={handleSignUp} className="flex flex-col gap-3">
            <InputField
              label={t("signup_full_name")}
              placeholder={t("signup_full_name_ph")}
              type="text"
              icon={<User size={18} />}
              value={fullName}
              onChange={setFullName}
              variant="light"
            />

            <InputField
              label={t("login_email")}
              placeholder={t("signup_email_ph")}
              type="email"
              icon={<Mail size={18} />}
              value={email}
              onChange={setEmail}
              variant="light"
            />

            <InputField
              label={t("login_password")}
              placeholder={t("signup_password_ph")}
              type="password"
              icon={<Lock size={18} />}
              value={password}
              onChange={setPassword}
              variant="light"
            />

            <InputField
              label={t("signup_confirm_password")}
              placeholder={t("signup_confirm_password_ph")}
              type="password"
              icon={<Lock size={18} />}
              value={confirmPassword}
              onChange={setConfirmPassword}
              variant="light"
            />

            {/* Terms checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 accent-[#089D97]"
              />
              <span className="font-['Inter',sans-serif] font-extralight text-[14px] sm:text-[16px] text-black break-words">
                {t("signup_agree")}{" "}
                <button
                  type="button"
                  onClick={() => onNavigate("terms")}
                  className="text-[#089d97] underline"
                >
                  {t("signup_terms")}
                </button>
              </span>
            </label>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-[12px] px-4 py-3">
                <p className="font-['Poppins',sans-serif] text-[13px] text-red-600">{error}</p>
              </div>
            )}

            {/* Sign Up button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#089D97] text-white font-['Inter',sans-serif] font-bold text-[18px] sm:text-[20px] py-3 rounded-[16px] sm:rounded-[20px] hover:bg-[#047975] transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? t("signup_creating") : t("signup_btn")}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-3">
            <div className="flex-1 h-px bg-black" />
            <span className="font-['Inter',sans-serif] font-extralight text-[16px] text-black whitespace-nowrap">{t("signup_or")}</span>
            <div className="flex-1 h-px bg-black" />
          </div>

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="mx-auto flex items-center justify-center gap-2 border border-gray-200 bg-white rounded-[14px] px-6 py-2 shadow-[0px_1px_2px_rgba(0,0,0,0.15)] hover:bg-gray-50 transition-colors disabled:opacity-60 font-['Inter',sans-serif] font-medium text-[16px] text-black"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            {t("auth_sign_in_google")}
          </button>

          {/* Login link */}
          <p className="text-center font-['Inter',sans-serif] text-[16px] text-black mt-2">
            {t("signup_have_account")}{" "}
            <button
              onClick={() => onNavigate("login")}
              className="text-[#047975] font-semibold underline hover:no-underline"
            >
              {t("signup_login_link")}
            </button>
          </p>
        </div>
        </div>
      </div>
      </div>

      {/* Bottom curvy shape — full-window, smooth double wave (inspo Vector at 81.23%) */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 w-full h-[48px] sm:h-[64px] overflow-hidden z-[5]">
        <svg
          viewBox="0 0 1440 180"
          preserveAspectRatio="none"
          className="w-full h-full block"
          fill="none"
        >
          {/* back soft layer */}
          <path
            d="M0 90 C 180 20, 360 20, 540 70 C 720 120, 900 130, 1080 90 C 1230 60, 1350 50, 1440 70 L1440 180 L0 180 Z"
            fill="#089D97"
            fillOpacity="0.14"
          />
          {/* front main wave — stretches whole window */}
          <path
            d="M0 110 C 200 50, 420 40, 640 85 C 860 130, 1040 135, 1220 95 C 1320 73, 1390 70, 1440 80 L1440 180 L0 180 Z"
            fill="#089D97"
            fillOpacity="0.26"
          />
          {/* thin highlight stroke on crest for a cleaner look */}
          <path
            d="M0 110 C 200 50, 420 40, 640 85 C 860 130, 1040 135, 1220 95 C 1320 73, 1390 70, 1440 80"
            stroke="#089D97"
            strokeOpacity="0.45"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}

function lastNamePartsTooLong(parts: string[]) {
  return parts.slice(1).join(" ").length > 80;
}
