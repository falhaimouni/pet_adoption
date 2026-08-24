import { useState } from "react";
import Navbar from "../components/Navbar";
import puppiesImg from "../imports/TermsAndConditions-2/7c457ab2a2d7637c44c2b710d5188196efcb58bb.png";
import pawLeafImg from "../imports/TermsAndConditions-2/c5ef6e7fef83234c87222ba3003b9cd587a39b1f.png";

// Page type removed — using string routing

interface TermsPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

export default function TermsPage({ onNavigate }: TermsPageProps) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="min-h-screen bg-[rgba(186,216,211,0.99)] flex flex-col">
      <Navbar activePage="terms" onNavigate={onNavigate} />

      <main className="flex-1 flex flex-col lg:flex-row items-start max-w-[1400px] mx-auto w-full px-6 py-10 gap-10">

        {/* ── Left decorative panel ── */}
        <div className="relative flex-shrink-0 flex flex-col items-center lg:w-[420px] hidden lg:flex">
          {/* Teal ellipse */}
          <div
            className="absolute top-[30px] left-[12px] w-[380px] h-[600px] rounded-full pointer-events-none"
            style={{ background: "rgba(8,157,151,0.26)" }}
          />

          {/* Puppies image */}
          <img
            src={puppiesImg}
            alt="Playful puppies"
            className="relative z-10 w-[320px] h-auto object-contain mt-[200px]"
          />

          {/* Paw leaf decoration */}
          <img
            src={pawLeafImg}
            alt=""
            className="absolute bottom-[40px] left-[60px] w-[168px] h-auto pointer-events-none opacity-80"
          />
        </div>

        {/* ── Right: Terms card ── */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-[20px] shadow-xl p-8 lg:p-10">
            {/* Title */}
            <h1 className="font-['Poppins',sans-serif] font-bold text-[36px] lg:text-[48px] mb-2">
              <span className="text-[#089D97]">Terms</span>
              {" and "}
              <span className="text-[#089D97]">Conditions</span>
            </h1>

            <p className="font-['Poppins',sans-serif] text-[14px] text-black mb-4 max-w-[560px]">
              Please read these Terms &amp; Conditions carefully before using Petopia. By accessing
              or using our website, you agree to the following terms.
            </p>

            <hr className="border-black mb-6" />

            {/* Content */}
            <div className="font-['Poppins',sans-serif] text-[13px] text-black space-y-4 max-h-[420px] overflow-y-auto pr-2">
              <section>
                <h3 className="font-semibold text-[#089D97] text-[15px] mb-1">Introduction</h3>
                <p>Welcome to Petopia. By using our website, you agree to these Terms &amp; Conditions.</p>
              </section>

              <section>
                <h3 className="font-semibold text-[#089D97] text-[15px] mb-1">User Responsibilities</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Provide accurate information.</li>
                  <li>Keep your account secure.</li>
                  <li>Use the platform respectfully.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-[#089D97] text-[15px] mb-1">Pet Adoption</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Provide a safe home.</li>
                  <li>Follow local animal welfare laws.</li>
                  <li>Adoption approval depends on the owner or shelter.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-[#089D97] text-[15px] mb-1">Privacy</h3>
                <p>Your personal information is protected and used only to improve our services.</p>
              </section>

              <section>
                <h3 className="font-semibold text-[#089D97] text-[15px] mb-1">Payments</h3>
                <p>All payments are processed securely. Refunds follow our Refund Policy.</p>
              </section>

              <section>
                <h3 className="font-semibold text-[#089D97] text-[15px] mb-1">Liability</h3>
                <p>
                  Petopia is not responsible for agreements between users or the health of adopted
                  pets after adoption.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-[#089D97] text-[15px] mb-1">Contact</h3>
                <p>📧 support@petopia.com</p>
                <p>📞 +962 799 281 091</p>
              </section>
            </div>

            {/* Agree checkbox */}
            <div className="mt-6 flex items-center gap-2">
              <input
                id="agree"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 accent-[#089D97]"
              />
              <label
                htmlFor="agree"
                className="font-['Poppins',sans-serif] font-medium text-[16px] text-[#089D97] cursor-pointer"
              >
                I have read and agree to the Terms &amp; Conditions.
              </label>
            </div>

            {/* Back to signup */}
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => onNavigate("signup")}
                disabled={!agreed}
                className="bg-[#089D97] disabled:opacity-40 text-white font-['Poppins',sans-serif] font-semibold text-[16px] px-8 py-3 rounded-[20px] hover:bg-[#047975] transition-colors"
              >
                Accept &amp; Continue
              </button>
              <button
                onClick={() => onNavigate("home")}
                className="border border-[#089D97] text-[#089D97] font-['Poppins',sans-serif] font-semibold text-[16px] px-8 py-3 rounded-[20px] hover:bg-[rgba(8,157,151,0.1)] transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
