import Navbar from "../components/Navbar";
import { useLanguage } from "../context/LanguageContext";
import { Heart, Home, CheckCircle, Users, Globe, ArrowRight, Mail, Phone, MapPin, PawPrint } from "lucide-react";

interface AboutPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

export default function AboutPage({ onNavigate }: AboutPageProps) {
  const { t } = useLanguage();

  const stats = [
    { value: "12,400+", label: t("about_stats_adopted") },
    { value: "98%",     label: t("about_stats_families") },
    { value: "85+",     label: t("about_stats_shelters") },
    { value: "6",       label: t("about_stats_countries") },
  ];

  const benefits = [
    { icon: Heart,       title: t("about_b1_title"), desc: t("about_b1_desc") },
    { icon: Home,        title: t("about_b2_title"), desc: t("about_b2_desc") },
    { icon: CheckCircle, title: t("about_b3_title"), desc: t("about_b3_desc") },
    { icon: Users,       title: t("about_b4_title"), desc: t("about_b4_desc") },
    { icon: Globe,       title: t("about_b5_title"), desc: t("about_b5_desc") },
    { icon: PawPrint,    title: t("about_b6_title"), desc: t("about_b6_desc") },
  ];

  const steps = [
    { num: "01", title: t("about_s1_title"), desc: t("about_s1_desc") },
    { num: "02", title: t("about_s2_title"), desc: t("about_s2_desc") },
    { num: "03", title: t("about_s3_title"), desc: t("about_s3_desc") },
    { num: "04", title: t("about_s4_title"), desc: t("about_s4_desc") },
  ];

  const contacts = [
    { icon: Mail,   label: t("about_email"),       value: "petadoptionsystem2000@gmail.com" },
  ];

  return (
    <div className="min-h-screen bg-[#f0f8f7]">
      <Navbar activePage="about" onNavigate={onNavigate} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#047975] to-[#089D97] text-white py-20 px-5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full bg-white" />
          <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] rounded-full bg-white" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 mb-6">
            <PawPrint size={14} />
            <span className="font-['Poppins',sans-serif] text-[13px] font-medium">{t("about_mission")}</span>
          </div>
          <h1 className="font-['Prata',serif] text-[40px] lg:text-[56px] leading-tight mb-6">
            {t("about_hero_title")}
          </h1>
          <p className="font-['Poppins',sans-serif] text-[17px] text-white/85 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t("about_hero_desc")}
          </p>
          <button
            onClick={() => onNavigate("pets")}
            className="inline-flex items-center gap-2 bg-white text-[#047975] font-['Poppins',sans-serif] font-semibold text-[15px] px-7 py-3.5 rounded-full hover:bg-[#e0f2f0] transition-colors shadow-lg"
          >
            {t("about_find_pet")} <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white border-b border-[rgba(8,157,151,0.1)] py-10 px-5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="font-['Prata',serif] text-[36px] text-[#089D97] leading-none">{value}</p>
              <p className="font-['Poppins',sans-serif] text-[13px] text-[#5a8a87] mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Adopt */}
      <section className="py-16 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-['Prata',serif] text-[32px] lg:text-[38px] text-[#1a2e2d] mb-3">{t("about_why_title")}</h2>
            <p className="font-['Poppins',sans-serif] text-[15px] text-[#5a8a87] max-w-xl mx-auto">
              {t("about_why_desc")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-[20px] p-6 shadow-sm hover:shadow-md transition-shadow border border-transparent hover:border-[rgba(8,157,151,0.12)]">
                <div className="w-11 h-11 bg-[#e0f2f0] rounded-[14px] flex items-center justify-center mb-4">
                  <Icon size={20} className="text-[#089D97]" />
                </div>
                <h3 className="font-['Poppins',sans-serif] font-semibold text-[15px] text-[#1a2e2d] mb-2">{title}</h3>
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#5a8a87] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-16 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-['Prata',serif] text-[32px] lg:text-[38px] text-[#1a2e2d] mb-3">{t("about_how_title")}</h2>
            <p className="font-['Poppins',sans-serif] text-[15px] text-[#5a8a87] max-w-xl mx-auto">
              {t("about_how_desc")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ num, title, desc }, i) => (
              <div key={num} className="relative flex flex-col items-center text-center">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-7 left-[calc(50%+28px)] w-[calc(100%-56px)] h-px bg-[rgba(8,157,151,0.2)]" />
                )}
                <div className="w-14 h-14 bg-gradient-to-br from-[#089D97] to-[#047975] rounded-full flex items-center justify-center mb-4 shadow-md relative z-10">
                  <span className="font-['Poppins',sans-serif] font-bold text-[15px] text-white">{num}</span>
                </div>
                <h3 className="font-['Poppins',sans-serif] font-semibold text-[15px] text-[#1a2e2d] mb-2">{title}</h3>
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#5a8a87] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Animal Welfare Commitment */}
      <section className="py-16 px-5">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#047975] to-[#089D97] rounded-[28px] p-10 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-[200px] h-[200px] rounded-full bg-white" />
            <div className="absolute -bottom-10 -left-10 w-[150px] h-[150px] rounded-full bg-white" />
          </div>
          <div className="relative z-10">
            <PawPrint size={36} className="mx-auto mb-4 opacity-80" />
            <h2 className="font-['Prata',serif] text-[28px] lg:text-[34px] mb-4">{t("about_commitment_title")}</h2>
            <p className="font-['Poppins',sans-serif] text-[15px] text-white/85 max-w-2xl mx-auto leading-relaxed mb-6">
              {t("about_commitment_desc")}
            </p>
            <button
              onClick={() => onNavigate("pets")}
              className="inline-flex items-center gap-2 bg-white text-[#047975] font-['Poppins',sans-serif] font-semibold text-[14px] px-6 py-3 rounded-full hover:bg-[#e0f2f0] transition-colors shadow-md"
            >
              {t("about_meet_pets")} <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-white py-16 px-5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-['Prata',serif] text-[32px] text-[#1a2e2d] mb-3">{t("about_contact_title")}</h2>
            <p className="font-['Poppins',sans-serif] text-[15px] text-[#5a8a87]">
              {t("about_contact_desc")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {contacts.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex flex-col items-center text-center p-6 bg-[#f0f8f7] rounded-[20px]">
                <div className="w-12 h-12 bg-[#e0f2f0] rounded-full flex items-center justify-center mb-3">
                  <Icon size={20} className="text-[#089D97]" />
                </div>
                <p className="font-['Poppins',sans-serif] font-semibold text-[13px] text-[#1a2e2d] mb-1">{label}</p>
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#5a8a87]">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer strip */}
      <div className="bg-[#1a2e2d] py-6 px-5 text-center">
        <p className="font-['Poppins',sans-serif] text-[13px] text-white/50">
          {t("about_footer")}
        </p>
      </div>
    </div>
  );
}
