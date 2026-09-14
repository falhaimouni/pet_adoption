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
      setError("First and last name must be 80 characters or less.");
      return;
    }
    if (!isEmail(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (!isStrongPassword(password)) {
      setError("Password must include uppercase, lowercase, number, and symbol.");
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
          email: email.trim(),
          password,
          confirmPassword,
        }),
      });
      onNavigate("login");
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
    <div className="min-h-screen lg:h-screen bg-[rgba(186,216,211,0.99)] flex flex-col relative overflow-hidden">
      <Navbar onNavigate={onNavigate} />
      <div className="relative flex flex-col lg:flex-row flex-1 lg:min-h-0 overflow-hidden pb-[70px] lg:pb-[56px]">

      {/* ── Left Panel ── */}
      <div className="relative flex-1 flex flex-col items-center justify-start pt-6 pb-0 lg:pt-0 lg:pb-0 min-h-[400px] lg:min-h-0 overflow-hidden">

        {/* Large soft organic blob behind the rabbits (left side) — inspo position */}
        <div className="absolute inset-0 flex items-start justify-start pointer-events-none">
          <div className="w-[min(88vw,480px)] lg:w-[min(40vw,560px)] h-[500px] lg:h-[640px] bg-[#089D97]/25 translate-x-[20px] lg:translate-x-[20px] translate-y-[20px] lg:translate-y-[30px] [border-radius:58%_42%_55%_45%/48%_56%_44%_52%]" />
        </div>

        {/* Paw prints scattered */}
        <PawPrint size={28} className="absolute top-[18%] right-[12%] text-white/70 rotate-12 pointer-events-none" fill="currentColor" />
        <PawPrint size={36} className="absolute top-[38%] right-[4%] text-white/80 -rotate-12 pointer-events-none hidden lg:block" fill="currentColor" />
        <PawPrint size={22} className="absolute bottom-[16%] left-[46%] text-[#089D97]/60 rotate-12 pointer-events-none" fill="currentColor" />
        <PawPrint size={34} className="absolute bottom-[6%] left-[8%] text-white/80 -rotate-12 pointer-events-none" fill="currentColor" />
        <PawPrint size={30} className="absolute bottom-[5%] right-[8%] text-white/80 rotate-12 pointer-events-none hidden lg:block" fill="currentColor" />

        {/* Join Petopia section — inspo: left-up (Join at ~57,195 / Petopia at ~188,213) */}
        <div className="relative z-10 flex flex-col items-start w-full max-w-[490px] px-8 lg:px-0 ml-[40px] lg:ml-[95px] lg:mr-auto mt-20 lg:mt-[120px] lg:absolute lg:top-0 lg:left-0">
          <p className="font-['Poppins',sans-serif] font-semibold text-[38px] lg:text-[60px] text-black rotate-[-0.7deg] leading-none flex items-center gap-3">
            {t("signup_tagline")}{" "}
            <span className="font-['Prata',serif] font-normal text-[#047975] text-[40px] lg:text-[52px] leading-none">Petopia</span>
            <PawPrint size={34} className="text-[#089D97]/50 -rotate-12" fill="currentColor" />
          </p>
          <p className="font-['Poppins',sans-serif] text-[15px] lg:text-[25px] text-black max-w-[340px] leading-snug mt-3 lg:ml-[2px]">
            {t("signup_subtitle")}
          </p>
        </div>

        {/* Two rabbits sitting together — inspo: big tan LEFT + small gray RIGHT, feet aligned, side-by-side */}
        <div className="relative z-10 flex w-full justify-center items-end mt-4 lg:mt-0 translate-x-[16px] lg:translate-x-0 lg:absolute lg:bottom-[20px] lg:left-[38px] lg:w-[600px] lg:justify-start lg:pl-0">
          {/* Larger brown/orange rabbit on the LEFT (behind) — inspo at [-18,398] */}
          <img
            src={tanBunnyImg}
            alt="Brown rabbit"
            className="w-[min(50vw,210px)] lg:w-[280px] lg:h-[280px] lg:object-cover h-auto object-contain relative z-0 ml-[10px] lg:ml-[12px]"
          />
          {/* Smaller gray rabbit tucked close on the RIGHT, beside the big one, feet aligned — inspo at [183,428] */}
          <img
            src={grayBunnyImg}
            alt="Gray rabbit"
            className="w-[min(42vw,175px)] lg:w-[245px] lg:h-[245px] lg:object-cover h-auto object-contain relative z-10 lg:-ml-[100px] lg:translate-y-[8px] -ml-12"
          />
        </div>

      </div>

      {/* ── Right Panel (white card) ── */}
      <div className="relative flex-1 lg:min-h-0 flex items-center justify-center p-4 lg:p-4">
        <div className="w-full max-w-[500px] relative mt-6 lg:mt-10">
          {/* Peeking cat from behind the top-right edge of the card — inspo at [1158,177] rotated 90deg */}
          <img
            src={catPhotoImg}
            alt=""
            className="absolute top-1/2 -translate-y-1/2 -right-[36px] lg:-right-[188px] w-[min(36vw,160px)] lg:w-[280px] h-auto object-contain pointer-events-none hidden sm:block z-20 rotate-90"
          />
        <div className="relative z-10 bg-white rounded-[30px] shadow-xl px-6 py-5 lg:px-10 lg:py-5 origin-top scale-[1.05] lg:scale-[1.08]">
          <h2 className="font-['Inter',sans-serif] font-semibold text-[24px] lg:text-[26px] text-black mb-1 text-center">{t("signup_title")}</h2>
          <p className="font-['Inter',sans-serif] font-light text-[14px] lg:text-[15px] text-black mb-4 text-center">
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
            />

            <InputField
              label={t("login_email")}
              placeholder={t("signup_email_ph")}
              type="email"
              icon={<Mail size={18} />}
              value={email}
              onChange={setEmail}
            />

            <InputField
              label={t("login_password")}
              placeholder={t("signup_password_ph")}
              type="password"
              icon={<Lock size={18} />}
              value={password}
              onChange={setPassword}
            />

            <InputField
              label={t("signup_confirm_password")}
              placeholder={t("signup_confirm_password_ph")}
              type="password"
              icon={<Lock size={18} />}
              value={confirmPassword}
              onChange={setConfirmPassword}
            />

            {/* Terms checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 accent-[#089D97]"
              />
              <span className="font-['Inter',sans-serif] font-extralight text-[16px] text-black">
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
              className="w-full bg-[#089D97] text-white font-['Inter',sans-serif] font-bold text-[20px] py-3 rounded-[20px] hover:bg-[#047975] transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
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
            Sign In with Google
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
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 w-full h-[64px] overflow-hidden z-[5]">
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
