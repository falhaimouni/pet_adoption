import { useText } from "../i18n/useText";
import { useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import puppiesImg from "../imports/TermsAndConditions-2/7c457ab2a2d7637c44c2b710d5188196efcb58bb.png";
import pawLeafImg from "../imports/TermsAndConditions-2/c5ef6e7fef83234c87222ba3003b9cd587a39b1f.png";

// Page type removed — using string routing

interface TermsPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

export default function TermsPage({ onNavigate }: TermsPageProps) {
  const tx = useText();
  const [agreed, setAgreed] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();

  function handleAccept() {
    onNavigate(user ? "user-profile" : "signup");
  }

  return (
    <div className="min-h-screen bg-[rgba(186,216,211,0.99)] flex flex-col">
      <Navbar activePage="terms" onNavigate={onNavigate} />

      <main className="flex-1 flex flex-col lg:flex-row items-start max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-8 sm:py-10 gap-10 overflow-x-hidden">

        {/* ── Left decorative panel ── */}
        <div className="relative flex-shrink-0 flex flex-col items-center lg:w-[420px] hidden lg:flex">
          {/* Teal ellipse */}
          <div
            className="absolute top-[30px] start-[12px] w-[380px] h-[600px] rounded-full pointer-events-none"
            style={{ background: "rgba(8,157,151,0.26)" }}
          />

          {/* Puppies image */}
          <img
            src={puppiesImg}
            alt=""
            className="relative z-10 w-[320px] h-auto object-contain mt-[200px]"
          />

          {/* Paw leaf decoration */}
          <img
            src={pawLeafImg}
            alt=""
            className="absolute bottom-[40px] start-[60px] w-[168px] h-auto pointer-events-none opacity-80"
          />
        </div>

        {/* ── Right: Terms card ── */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-[20px] shadow-xl p-5 sm:p-8 lg:p-10 max-w-full overflow-hidden">
            <p className="font-['Poppins',sans-serif] text-[12px] text-black/50 mb-2">{t("terms_last_updated")}</p>
            {/* Title */}
            <h1 className="font-['Poppins',sans-serif] font-bold text-[30px] sm:text-[36px] lg:text-[48px] leading-tight mb-2 break-words">
              <span className="text-[#089D97]">{t("terms_title_1")}</span>
              {" "}{t("terms_and")}{" "}
              <span className="text-[#089D97]">{t("terms_title_2")}</span>
            </h1>

            <p className="font-['Poppins',sans-serif] text-[14px] text-black mb-4 max-w-[560px]">
              {t("terms_subtitle")}
            </p>

            <hr className="border-black mb-6" />

            {/* Content */}
            <div className="font-['Poppins',sans-serif] text-[13px] text-black space-y-4 max-h-[420px] overflow-y-auto overflow-x-hidden pe-2 break-words">
              <section>
                <h3 className="font-semibold text-[#089D97] text-[15px] mb-1">{t("terms_s1_title")}</h3>
                <p>{t("terms_s1_body")}</p>
              </section>

              <section>
                <h3 className="font-semibold text-[#089D97] text-[15px] mb-1">{t("terms_s2_title")}</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>{t("terms_s2_li1")}</li>
                  <li>{t("terms_s2_li2")}</li>
                  <li>{t("terms_s2_li3")}</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-[#089D97] text-[15px] mb-1">{t("terms_s3_title")}</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>{t("terms_s3_li1")}</li>
                  <li>{t("terms_s3_li2")}</li>
                  <li>{t("terms_s3_li3")}</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-[#089D97] text-[15px] mb-1">{t("terms_s4_title")}</h3>
                <p>{t("terms_s4_body")}</p>
              </section>

              <section>
                <h3 className="font-semibold text-[#089D97] text-[15px] mb-1">{t("terms_s5_title")}</h3>
                <p>{t("terms_s5_body")}</p>
              </section>

              <section>
                <h3 className="font-semibold text-[#089D97] text-[15px] mb-1">{t("terms_s6_title")}</h3>
                <p>{t("terms_s6_body")}</p>
              </section>

              <section>
                <h3 className="font-semibold text-[#089D97] text-[15px] mb-1">{t("about_contact_title")}</h3>
                <p>{tx("Email: petadoptionsystem2000@gmail.com")}</p>
              </section>

              <section>
                <h3 className="font-semibold text-[#089D97] text-[15px] mb-1">{t("terms_account_system_title")}</h3>
                <p>{t("terms_account_system_body")}</p>
              </section>

              <section>
                <h3 className="font-semibold text-[#089D97] text-[15px] mb-1">{t("terms_store_inventory_title")}</h3>
                <p>{t("terms_store_inventory_body")}</p>
              </section>
            </div>

            {/* Agree checkbox */}
            <div className="mt-6 flex items-start gap-2">
              <input
                id="agree"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 mt-1 accent-[#089D97] flex-shrink-0"
              />
              <label
                htmlFor="agree"
                className="font-['Poppins',sans-serif] font-medium text-[14px] sm:text-[16px] text-[#089D97] cursor-pointer leading-snug"
              >
                {t("terms_agree_label")}
              </label>
            </div>

            {/* Continue */}
            <div className="mt-6 flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4">
              <button
                onClick={handleAccept}
                disabled={!agreed}
                className="w-full sm:w-auto bg-[#089D97] disabled:opacity-40 text-white font-['Poppins',sans-serif] font-semibold text-[15px] sm:text-[16px] px-6 sm:px-8 py-3 rounded-[20px] hover:bg-[#047975] transition-colors"
              >
                {t("terms_accept")}
              </button>
              <button
                type="button"
                onClick={() => onNavigate("privacy")}
                className="w-full sm:w-auto border border-[#089D97] text-[#089D97] font-['Poppins',sans-serif] font-semibold text-[15px] sm:text-[16px] px-6 sm:px-8 py-3 rounded-[20px] hover:bg-[rgba(8,157,151,0.1)] transition-colors"
              >
                {t("privacy_title")}
              </button>
              <button
                onClick={() => onNavigate("home")}
                className="w-full sm:w-auto border border-[#089D97] text-[#089D97] font-['Poppins',sans-serif] font-semibold text-[15px] sm:text-[16px] px-6 sm:px-8 py-3 rounded-[20px] hover:bg-[rgba(8,157,151,0.1)] transition-colors"
              >
                {t("terms_back")}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
