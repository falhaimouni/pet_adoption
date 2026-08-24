import { useState, useRef, useEffect } from "react";
import { ShoppingCart, Menu, X, PawPrint, ChevronDown, User, Settings, LogOut, MessageSquare, Package, Sun, Moon, Globe } from "lucide-react";
import logoImg from "../imports/Home/be6bd1f12e9a602c8830a9c39abaf73ad65d4682.png";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

interface NavbarProps {
  activePage?: string;
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

export default function Navbar({ activePage, onNavigate }: NavbarProps) {
  const { t, lang, setLang } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const NAV_LINKS = [
    { label: t("nav_home"),  page: "home" },
    { label: t("nav_pets"),  page: "pets" },
    { label: t("nav_shop"),  page: "shop" },
    { label: t("nav_about"), page: "about" },
  ];
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { count: cartCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function nav(page: string) {
    onNavigate(page);
    setMenuOpen(false);
    setDropdownOpen(false);
  }

  function handleLogout() {
    logout();
    nav("pets");
  }

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const dashboardPage =
    user?.role === "admin" ? "admin-dashboard"
    : user?.role === "manager" ? "manager-dashboard"
    : user?.role === "staff" ? "staff-dashboard"
    : user?.role === "vet" ? "vet-pets"
    : "pets";

  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-30 border-b border-[rgba(8,157,151,0.08)]">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-[76px] px-[22px] py-[0px] mx-[210px] my-[0px]">
        {/* Logo */}
        <button onClick={() => nav("home")} className="flex items-center">
          <img src={logoImg} alt="Petopia" className="h-[155px] w-auto object-contain my-[-1px] mx-[-26px] my-[0px]" />
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ label, page }) => (
            <button
              key={page}
              onClick={() => nav(page)}
              className={`px-4 py-2 rounded-[10px] font-['Poppins',sans-serif] font-medium text-[15px] transition-all ${
                activePage === page
                  ? "bg-[#e0f2f0] text-[#089D97]"
                  : "text-[#1a2e2d]/70 hover:text-[#089D97] hover:bg-[#f0f9f8]"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            aria-label="Toggle language"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] text-[#1a2e2d]/60 hover:text-[#089D97] hover:bg-[#f0f9f8] transition-all font-['Poppins',sans-serif] text-[13px] font-medium"
          >
            <Globe size={15} />
            <span>{lang === "en" ? "ع" : "EN"}</span>
          </button>

          {/* Dark / Light toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[#1a2e2d]/60 hover:text-[#089D97] hover:bg-[#f0f9f8] transition-all"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Cart */}
          <button
            onClick={() => nav("cart")}
            aria-label="Cart"
            className="relative w-9 h-9 rounded-[10px] flex items-center justify-center text-[#1a2e2d]/60 hover:text-[#089D97] hover:bg-[#f0f9f8] transition-all"
          >
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#089D97] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </button>

          {/* Auth area — desktop */}
          {isAuthenticated && user ? (
            <div className="relative hidden md:block" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-[12px] hover:bg-[#f0f9f8] transition-colors"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#089D97] to-[#047975] flex items-center justify-center">
                    <span className="font-['Poppins',sans-serif] font-bold text-[11px] text-white">{initials}</span>
                  </div>
                )}
                <span className="font-['Poppins',sans-serif] font-medium text-[13px] text-[#1a2e2d] max-w-[90px] truncate">
                  {user.name.split(" ")[0]}
                </span>
                <ChevronDown size={14} className={`text-[#5a8a87] transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-[16px] shadow-xl border border-[rgba(8,157,151,0.1)] py-2 z-50">
                  <div className="px-4 py-3 border-b border-[#f0f8f7]">
                    <p className="font-['Poppins',sans-serif] font-semibold text-[13px] text-[#1a2e2d] truncate">{user.name}</p>
                    <p className="font-['Poppins',sans-serif] text-[11px] text-[#5a8a87] truncate capitalize">{user.role} · @{user.username}</p>
                  </div>
                  {[
                    { label: t("nav_profile"),  page: "user-profile",  icon: User },
                    { label: "My Petopia",       page: dashboardPage,   icon: PawPrint },
                    { label: t("nav_orders") || "My Orders", page: "orders", icon: Package },
                    { label: t("nav_messages") || "Messages", page: "chats", icon: MessageSquare },
                    { label: t("nav_settings"),  page: "settings",      icon: Settings },
                  ].map(({ label, page, icon: Icon }) => (
                    <button
                      key={page}
                      onClick={() => nav(page)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f0f8f7] transition-colors font-['Poppins',sans-serif] text-[13px] text-[#1a2e2d]"
                    >
                      <Icon size={15} className="text-[#089D97]" />
                      {label}
                    </button>
                  ))}
                  <div className="border-t border-[#f0f8f7] mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-rose-50 transition-colors font-['Poppins',sans-serif] text-[13px] text-rose-600"
                    >
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => nav("login")}
                className="px-4 py-2 font-['Poppins',sans-serif] font-medium text-[14px] text-[#089D97] hover:bg-[#f0f9f8] rounded-[10px] transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => nav("signup")}
                className="flex items-center gap-2 px-4 py-2 bg-[#089D97] text-white font-['Poppins',sans-serif] font-medium text-[14px] rounded-[10px] hover:bg-[#047975] transition-colors"
              >
                <PawPrint size={15} /> Sign Up
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-9 h-9 rounded-[10px] flex items-center justify-center text-[#1a2e2d]/60 hover:bg-[#f0f9f8] transition-colors"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-[rgba(8,157,151,0.1)] px-5 py-3 flex flex-col gap-1">
          {NAV_LINKS.map(({ label, page }) => (
            <button
              key={page}
              onClick={() => nav(page)}
              className="text-left px-3 py-2.5 rounded-[10px] font-['Poppins',sans-serif] font-medium text-[15px] text-[#1a2e2d]/70 hover:bg-[#f0f9f8] hover:text-[#089D97] transition-colors"
            >
              {label}
            </button>
          ))}

          {isAuthenticated && user ? (
            <>
              <div className="flex items-center gap-3 px-3 py-3 border-t border-[#f0f8f7] mt-1">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#089D97] to-[#047975] flex items-center justify-center">
                    <span className="font-bold text-[11px] text-white">{initials}</span>
                  </div>
                )}
                <div>
                  <p className="font-['Poppins',sans-serif] font-semibold text-[13px] text-[#1a2e2d]">{user.name}</p>
                  <p className="font-['Poppins',sans-serif] text-[11px] text-[#5a8a87] capitalize">{user.role}</p>
                </div>
              </div>
              <button onClick={() => nav("user-profile")} className="text-left px-3 py-2.5 rounded-[10px] font-['Poppins',sans-serif] text-[14px] text-[#1a2e2d]/70 hover:bg-[#f0f9f8]">My Profile</button>
              <button onClick={() => nav(dashboardPage)} className="text-left px-3 py-2.5 rounded-[10px] font-['Poppins',sans-serif] text-[14px] text-[#1a2e2d]/70 hover:bg-[#f0f9f8]">My Petopia</button>
              <button onClick={() => nav("settings")} className="text-left px-3 py-2.5 rounded-[10px] font-['Poppins',sans-serif] text-[14px] text-[#1a2e2d]/70 hover:bg-[#f0f9f8]">Settings</button>
              <button onClick={handleLogout} className="mt-1 px-3 py-2.5 bg-rose-50 text-rose-600 font-['Poppins',sans-serif] font-medium text-[14px] rounded-[10px] text-center hover:bg-rose-100 transition-colors">
                Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={() => nav("login")} className="mt-1 px-3 py-2.5 border border-[#089D97] text-[#089D97] font-['Poppins',sans-serif] font-medium text-[14px] rounded-[10px] text-center hover:bg-[#e0f2f0] transition-colors">
                Login
              </button>
              <button onClick={() => nav("signup")} className="mt-1 px-3 py-2.5 bg-[#089D97] text-white font-['Poppins',sans-serif] font-medium text-[14px] rounded-[10px] text-center hover:bg-[#047975] transition-colors">
                Sign Up
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
