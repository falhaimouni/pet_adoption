import { useState } from "react";
import { User, Lock } from "lucide-react";
import InputField from "../components/InputField";
import dogImg from "../imports/Login/69b6e36eb99058fdf605168f149a065c8e920c01.png";
import smallDogImg from "../imports/Login/802360a33575269f1c4bd4c214efd91fa36b93bf.png";
import catPhotoImg from "../imports/Login/9bd62fd6b651515e439f303dbe7dcc8978ef5b6a.png";
import googleImg from "../imports/Login/ffc70188699e78416744acd46b1e3cf38e40661a.png";
import pawLeafImg from "../imports/Login/c5ef6e7fef83234c87222ba3003b9cd587a39b1f.png";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../context/AuthContext";
import Navbar from "../components/Navbar";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    const loggedInUser = await login(email, password);
    setLoading(false);
    if (!loggedInUser) {
      setError("Invalid email or password.");
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

  return (
    <div className="min-h-screen bg-[rgba(186,216,211,0.99)] flex flex-col">
      <Navbar onNavigate={onNavigate} />

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row flex-1">

        {/* ── Left Panel ── */}
        <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden min-h-[320px] lg:min-h-0 py-10 lg:py-0">

          {/* Teal circle blob */}
          <div className="absolute inset-0 pointer-events-none hidden lg:block">
            <svg viewBox="0 0 600 600" fill="none" className="absolute w-[520px] h-auto top-1/2 left-[5%] -translate-y-1/2">
              <circle cx="300" cy="300" r="260" fill="#089D97" fillOpacity="0.22" />
            </svg>
          </div>

          {/* Brand text block */}
          <div className="relative z-10 flex flex-col items-center lg:items-start px-8 xl:px-14 w-full max-w-[480px] lg:max-w-none">
            <div className="flex items-end gap-2 mb-1">
              <h2 className="font-['Prata',serif] text-[68px] text-[#047975] leading-tight">
                Petopia
              </h2>
              <img
                src={smallDogImg}
                alt=""
                className="w-[56px] h-auto object-contain mb-1 hidden lg:block"
              />
            </div>
            <p className="font-['Poppins',sans-serif] font-semibold text-[44px] text-black rotate-[-0.7deg] mb-3">
              Welcome to
            </p>
            <p className="font-['Poppins',sans-serif] text-[22px] text-black max-w-[300px]">
              find your perfect furry companion
            </p>
          </div>

          {/* Dog + Cat stacked together */}
          <div className="relative z-10 flex justify-center w-full mt-2">
            <div className="relative">
              <img
                src={dogImg}
                alt="Dog"
                className="w-[420px] h-auto object-contain"
              />
              <img
                src={catPhotoImg}
                alt=""
                className="absolute -top-[80px] -right-[90px] w-[180px] h-auto object-contain pointer-events-none hidden lg:block"
              />
            </div>
          </div>

          {/* Tagline card */}
          <div className="hidden lg:flex absolute z-20 bottom-[9%] left-[38%] bg-[rgba(186,216,211,0.96)] border border-white rounded-[30px] shadow-[7px_7px_1px_0px_rgba(0,0,0,0.25)] px-5 py-4 max-w-[260px]">
            <p className="font-['Poppins',sans-serif] text-[15px] text-black leading-snug">
              A home without a pet is just a house.
            </p>
          </div>

          {/* Paw leaf — bottom-left */}
          <img
            src={pawLeafImg}
            alt=""
            className="absolute bottom-[5%] left-[5%] w-[140px] h-auto pointer-events-none hidden lg:block"
          />
        </div>

        {/* ── Right Panel ── */}
        <div className="flex-1 flex items-center justify-center px-10 py-10">
          <div className="w-full max-w-[500px] bg-white rounded-[30px] shadow-xl p-10">
            <h2 className="font-['Inter',sans-serif] font-semibold text-[32px] text-black mb-1">
              Welcome back!
            </h2>
            <p className="font-['Inter',sans-serif] font-light text-[18px] text-black mb-8">
              Login to continue to Petopia
            </p>

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <InputField
                label="Email"
                placeholder="Enter your email"
                type="email"
                icon={<User size={18} />}
                value={email}
                onChange={setEmail}
              />
              <InputField
                label="Password"
                placeholder="Enter your password"
                type="password"
                icon={<Lock size={18} />}
                value={password}
                onChange={setPassword}
              />

              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-[#089D97]"
                  />
                  <span className="font-['Inter',sans-serif] font-extralight text-[15px] text-black">
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  className="font-['Inter',sans-serif] text-[15px] text-[rgba(8,157,151,0.99)] hover:underline"
                >
                  Forgot Password?
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
                {loading ? "Signing in…" : "Login"}
              </button>
            </form>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-black/20" />
              <span className="font-['Inter',sans-serif] font-extralight text-[14px] text-black/60 whitespace-nowrap">
                or continue with
              </span>
              <div className="flex-1 h-px bg-black/20" />
            </div>

            <button className="w-full flex items-center justify-center gap-3 bg-[rgba(186,216,211,0.64)] py-3 rounded-[10px] hover:bg-[rgba(186,216,211,0.9)] transition-colors">
              <img src={googleImg} alt="Google" className="w-7 h-7 object-contain" />
              <span className="font-['Inter',sans-serif] text-[18px] text-black">Google</span>
            </button>

            <p className="text-center mt-6 font-['Inter',sans-serif] text-[15px] text-black">
              {"Don't have an account? "}
              <button
                onClick={() => onNavigate("signup")}
                className="text-[#047975] font-semibold hover:underline"
              >
                Sign Up
              </button>
            </p>

            <div className="mt-4 border border-gray-100 rounded-[14px] p-3">
              <p className="font-['Poppins',sans-serif] text-[11px] text-black/40 text-center mb-2">Quick login — tap a role</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  { label: "Adopter", email: "adopter@petopia.com" },
                  { label: "Vet", email: "vet@petopia.com" },
                  { label: "Staff", email: "staff@petopia.com" },
                  { label: "Manager", email: "manager@petopia.com" },
                  { label: "Admin", email: "admin@petopia.com" },
                ].map(({ label, email }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => { setEmail(email); setPassword("123"); }}
                    className="px-3 py-1.5 rounded-full bg-[rgba(8,157,151,0.08)] text-[#047975] font-['Poppins',sans-serif] text-[12px] font-medium hover:bg-[rgba(8,157,151,0.18)] transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
