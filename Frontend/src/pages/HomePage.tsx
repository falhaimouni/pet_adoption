import Navbar from "../components/Navbar";
import { useLanguage } from "../context/LanguageContext";
import goldenDogImg from "../imports/Home/6873b1dc8519e91f8d65e08b4fbf144707066349.png";
import catImg from "../imports/Home/735b39631c3076cb0778dad52f238169e2713381.png";
import birdImg from "../imports/Home/6f5298bd83b70612fe7b7b98baa18fd18e5a0582.png";
import pawLeafImg from "../imports/Home/c5ef6e7fef83234c87222ba3003b9cd587a39b1f.png";
import adobeExpressImg from "../imports/Home/331c169921d8a7edeed78356c7a9cf70e32e5bef.png";

// Page type removed — using string routing

interface HomePageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-[rgba(186,216,211,0.99)] flex flex-col">
      <Navbar activePage="home" onNavigate={onNavigate} />

      {/* Hero Section */}
      <main className="flex-1 relative">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10 lg:py-16 flex flex-col lg:flex-row items-center gap-10 lg:gap-0 min-h-[calc(100vh-80px)] overflow-hidden">

          {/* Left: Text Content */}
          <div className="flex-1 z-10 max-w-[600px]">
            {/* Decorative bird near top */}
            <div className="hidden lg:block absolute left-[540px] top-[90px] w-[108px] h-[89px] pointer-events-none">
              <img src={birdImg} alt="" className="w-full h-full object-cover" />
            </div>

            <h1 className="font-['Poppins',sans-serif] font-bold text-[clamp(2.25rem,11vw,3.75rem)] text-black leading-tight mb-6 break-words">
              {t("home_hero_line1")}
              <br />
              {t("home_hero_line2")}
            </h1>

            <p className="font-['Quattrocento',serif] text-[18px] sm:text-[20px] text-black leading-relaxed mb-8 max-w-[534px]">
              <span className="font-bold">petopia</span>
              {" "}{t("home_hero_desc1")}
            </p>

            <div className="flex flex-col xs:flex-row sm:flex-row flex-wrap gap-3 sm:gap-4">
              <button
                onClick={() => onNavigate("pets")}
                className="bg-[#089D97] text-white font-['Poppins',sans-serif] font-semibold text-[16px] sm:text-[18px] px-6 sm:px-8 py-3 rounded-[20px] hover:bg-[#047975] transition-colors shadow-md"
              >
                {t("home_browse_pets")}
              </button>
              <button
                onClick={() => onNavigate("signup")}
                className="border-2 border-[#089D97] text-[#089D97] font-['Poppins',sans-serif] font-semibold text-[16px] sm:text-[18px] px-6 sm:px-8 py-3 rounded-[20px] hover:bg-[#089D97] hover:text-white transition-colors"
              >
                {t("home_get_started")}
              </button>
            </div>
          </div>

          {/* Right: Images */}
          <div className="flex-1 relative flex items-center justify-center lg:justify-end min-h-[320px] sm:min-h-[400px] lg:min-h-[600px] w-full lg:w-auto overflow-hidden">
            {/* Teal ellipse background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="w-[min(92vw,590px)] aspect-square rounded-full opacity-30 mt-[20px] mb-[10px]"
                style={{ background: "#089D97" }}
              />
            </div>

            {/* Golden dog — main hero image */}
            <img
              src={goldenDogImg}
              alt="Golden Retriever"
              className="relative z-10 w-[min(72vw,320px)] sm:w-[380px] lg:w-[448px] h-auto object-contain drop-shadow-lg my-[-22px]"
            />

            {/* Cat — bottom right decorative */}
            <img
              src={catImg}
              alt="Cat"
              className="absolute bottom-[-24px] right-[4%] lg:right-[-20px] w-[150px] sm:w-[220px] lg:w-[260px] h-auto object-contain z-20 pointer-events-none my-[10px]"
            />

            {/* Adobe Express sticker — top right */}
            <img
              src={adobeExpressImg}
              alt=""
              className="absolute top-[10px] right-[10px] w-[80px] h-auto object-contain pointer-events-none hidden lg:block"
            />

            {/* Paw/leaf decorations */}
            <img
              src={pawLeafImg}
              alt=""
              className="absolute top-[-10px] left-[0px] w-[140px] h-auto object-contain pointer-events-none opacity-80 hidden lg:block"
            />
            <img
              src={pawLeafImg}
              alt=""
              className="absolute bottom-[60px] left-[-20px] w-[120px] h-auto -rotate-90 object-contain pointer-events-none opacity-80 hidden lg:block"
            />
          </div>
        </div>

        {/* Bottom wave decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-[60px] pointer-events-none overflow-hidden">
          <svg
            viewBox="0 0 1360 60"
            preserveAspectRatio="none"
            className="w-full h-full"
            fill="none"
          >
            <path
              d="M0 40 Q340 0 680 30 Q1020 60 1360 20 L1360 60 L0 60 Z"
              fill="#089D97"
              fillOpacity="0.26"
            />
          </svg>
        </div>
      </main>
    </div>
  );
}
