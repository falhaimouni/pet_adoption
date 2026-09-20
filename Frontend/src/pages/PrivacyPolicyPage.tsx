import Navbar from "../components/Navbar";
import { useLanguage } from "../context/LanguageContext";

interface PrivacyPolicyPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

const UPDATED = "August 24, 2026";

export default function PrivacyPolicyPage({ onNavigate }: PrivacyPolicyPageProps) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#f0f8f7]">
      <Navbar activePage="privacy" onNavigate={onNavigate} />
      <main className="max-w-4xl mx-auto px-5 py-10 pb-16">
        <article className="bg-white rounded-[20px] shadow-sm p-6 md:p-10 font-['Poppins',sans-serif] text-[#1a2e2d]">
          <p className="text-[13px] text-[#5a8a87] mb-2">{t("privacy_last_updated").replace("{date}", UPDATED)}</p>
          <h1 className="font-['Prata',serif] text-[34px] mb-5">{t("privacy_title")}</h1>
          <div className="space-y-5 text-[14px] leading-relaxed">
            <p>{t("privacy_intro")}</p>
            <section>
              <h2 className="font-semibold text-[#089D97] mb-1">{t("privacy_collect_title")}</h2>
              <p>{t("privacy_collect_body")}</p>
            </section>
            <section>
              <h2 className="font-semibold text-[#089D97] mb-1">{t("privacy_use_title")}</h2>
              <p>{t("privacy_use_body")}</p>
            </section>
            <section>
              <h2 className="font-semibold text-[#089D97] mb-1">{t("privacy_security_title")}</h2>
              <p>{t("privacy_security_body")}</p>
            </section>
            <section>
              <h2 className="font-semibold text-[#089D97] mb-1">{t("privacy_sharing_title")}</h2>
              <p>{t("privacy_sharing_body")}</p>
            </section>
            <section>
              <h2 className="font-semibold text-[#089D97] mb-1">{t("privacy_choices_title")}</h2>
              <p>{t("privacy_choices_body")}</p>
            </section>
            <section>
              <h2 className="font-semibold text-[#089D97] mb-1">{t("privacy_contact_title")}</h2>
              <p>{t("privacy_contact_body")}</p>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}
