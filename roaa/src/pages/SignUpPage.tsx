import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { User, Lock } from "lucide-react";
import InputField from "../components/InputField";
import logoImg from "../imports/SignUp/be6bd1f12e9a602c8830a9c39abaf73ad65d4682.png";
import Navbar from "../components/Navbar";
import bunnyImg from "../imports/SignUp/837dd37472b653b75b172453adc068d3edf2a940.png";
import erasebgImg from "../imports/SignUp/462532442e400e61d6592bda9436532a884ac924.png";
import smallDogImg from "../imports/SignUp/802360a33575269f1c4bd4c214efd91fa36b93bf.png";
import catPhotoImg from "../imports/SignUp/34fffaeeed62376fd4622534a964d6760ea2fa50.png";

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

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate("pets");
  };

  return (
    <div className="min-h-screen bg-[rgba(186,216,211,0.99)] flex flex-col">
      <Navbar onNavigate={onNavigate} />
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

      {/* ── Left Panel ── */}
      <div className="relative flex-1 flex flex-col items-center justify-center pt-6 pb-0 lg:pt-0 lg:pb-0 min-h-[280px] lg:min-h-screen overflow-hidden">

        {/* Left teal blob */}
        <div className="absolute left-0 top-[109px] w-[500px] h-[712px] pointer-events-none hidden lg:block">
          <div style={{ position: "absolute", width: "500px", height: "700px", left: "100px", top: "50px" }}>
            <div
                style={{
                  position: "absolute",
                  width: "620px",
                  height: "780px",
                  left: "-60px", // Move part of it off-screen
                  top: "-10px",
                  transform: "rotate(-8deg)",
                  zIndex: 0,
                  pointerEvents: "none",
                }}
              >
                <svg
                  viewBox="0 0 700 800"
                  className="w-full h-full"
                  preserveAspectRatio="none"
                >
                  <ellipse
                    cx="350"
                    cy="400"
                    rx="285"
                    ry="355"
                    fill="#89D3D0"
                    fillOpacity="0.35"
                  />
                </svg>
</div>
          </div>
        </div>

        {/* Brand + tagline */}
        <div className="relative z-10 mt-[100px] lg:mt-0 flex flex-col items-center lg:items-start px-10">
          <div className="flex items-start gap-2 mb-2">
            <h2 className="font-['Prata',serif] text-[48px] lg:text-[56px] text-[#047975] leading-tight">Petopia</h2>
            <img src={smallDogImg} alt="" className="w-[50px] h-auto object-contain mt-1 hidden lg:block" />
          </div>

          <p className="font-['Poppins',sans-serif] font-semibold text-[40px] lg:text-[55px] text-black rotate-[-0.7deg] mb-2">{t("signup_tagline")}</p>
          <p className="font-['Poppins',sans-serif] text-[18px] lg:text-[24px] text-black max-w-[280px]">
            {t("signup_subtitle")}
          </p>
        </div>

        {/* Large bunny — centered below the text block */}
        <img
          src={bunnyImg}
          alt="Bunny"
          className="absolute bottom-[20px] left-1/2 -translate-x-1/2 w-[300px] h-auto object-contain pointer-events-none hidden lg:block z-10"
        />
        {/* Mobile bunny (flow) */}
        <div className="relative z-10 flex justify-center mt-4 lg:hidden">
          <img src={bunnyImg} alt="Bunny" className="w-[220px] h-auto object-contain" />
        </div>

        {/* Small rabbit — bottom-left corner */}
        <img
          src={erasebgImg}
          alt=""
          className="absolute bottom-6 left-40 w-[200px] h-auto pointer-events-none hidden lg:block"
        />

      </div>

      {/* ── Right Panel (white card) ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-[500px] relative">
          {/* Cat photo sits above the white card */}
          <img
            src={catPhotoImg}
            alt=""
            className="absolute -top-[40px] right-90 w-[150px] h-auto pointer-events-none hidden lg:block z-20"
          />
        <div className="bg-white rounded-[30px] shadow-xl p-8 lg:p-10">
          <h2 className="font-['Inter',sans-serif] font-semibold text-[32px] text-black mb-1">{t("signup_title")}</h2>
          <p className="font-['Inter',sans-serif] font-light text-[18px] text-black mb-8">
            {t("signup_subtitle2")}
          </p>

          <form onSubmit={handleSignUp} className="flex flex-col gap-5">
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
              icon={<User size={18} />}
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

            {/* Sign Up button */}
            <button
              type="submit"
              className="w-full bg-[#089D97] text-white font-['Inter',sans-serif] font-bold text-[24px] py-4 rounded-[20px] hover:bg-[#047975] transition-colors shadow-md"
            >
              {t("signup_btn")}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-black" />
            <span className="font-['Inter',sans-serif] font-extralight text-[18px] text-black whitespace-nowrap">{t("signup_or")}</span>
            <div className="flex-1 h-px bg-black" />
          </div>

          {/* Login link */}
          <p className="text-center font-['Inter',sans-serif] text-[16px] text-black">
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
    </div>
  );
}
