import { useState, useRef, useEffect } from "react";
import { Menu, X, PawPrint, ChevronDown, User, Settings, LogOut, Sun, Moon, Globe, ShoppingCart, Bell, CheckCheck } from "lucide-react";
import logoImg from "../imports/Home/be6bd1f12e9a602c8830a9c39abaf73ad65d4682.png";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";
import { apiFetch } from "../lib/api";

interface NavbarProps {
  activePage?: string;
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

export default function Navbar({ activePage, onNavigate }: NavbarProps) {
  const { t, lang, setLang } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { count } = useCart();
  const NAV_LINKS = [
    { label: t("nav_home"),  page: "home" },
    { label: t("nav_pets"),  page: "pets" },
    { label: t("nav_shop"),  page: "shop" },
    { label: t("nav_about"), page: "about" },
  ];
  const LEGAL_LINKS = [
    { label: "Privacy", page: "privacy" },
    { label: "Terms", page: "terms" },
  ];
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string }>>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, logout } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const canUseShopping = isAuthenticated && user?.role === "adopter";
  const visibleNavLinks = canUseShopping
    ? NAV_LINKS
    : NAV_LINKS.filter((link) => link.page === "home");

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadNotifications(0);
      setNotifications([]);
      return;
    }

    let cancelled = false;
    async function loadNotifications() {
      try {
        const [countData, items] = await Promise.all([
          apiFetch<{ count: number }>("/notifications/unread-count"),
          apiFetch<Array<{ id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string }>>("/notifications"),
        ]);
        if (!cancelled) {
          setUnreadNotifications(Number(countData.count ?? 0));
          setNotifications(items);
        }
      } catch {
        if (!cancelled) {
          setUnreadNotifications(0);
          setNotifications([]);
        }
      }
    }

    void loadNotifications();
    window.addEventListener("petopia:notifications-changed", loadNotifications);
    return () => {
      cancelled = true;
      window.removeEventListener("petopia:notifications-changed", loadNotifications);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function nav(page: string) {
    onNavigate(page);
    setMenuOpen(false);
    setDropdownOpen(false);
    setNotificationsOpen(false);
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
    : user?.role === "vet" ? "vet-dashboard"
    : "profile";

  async function markAllNotificationsRead() {
    await apiFetch("/notifications/read-all", { method: "PATCH" });
    setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
    setUnreadNotifications(0);
  }

  const previewNotifications = notifications.slice(0, 3);

  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-30 border-b border-[rgba(8,157,151,0.08)]">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-[76px] px-4 sm:px-6">
        {/* Logo */}
        <button onClick={() => nav("home")} className="flex items-center">
          <img src={logoImg} alt="Petopia" className="h-[120px] w-auto object-contain -mx-5" />
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {visibleNavLinks.map(({ label, page }) => (
            <button
              key={page}
              onClick={() => nav(page === "home" && isAuthenticated ? dashboardPage : page)}
              className={`px-4 py-2 rounded-[10px] font-['Poppins',sans-serif] font-medium text-[15px] transition-all ${
                activePage === page
                  ? "bg-[#e0f2f0] text-[#089D97]"
                  : "text-[#1a2e2d]/70 hover:text-[#089D97] hover:bg-[#f0f9f8]"
              }`}
            >
              {label}
            </button>
          ))}
          <div className="hidden md:flex items-center border-l border-[#e0f2f0] ml-2 pl-2">
            {LEGAL_LINKS.map(({ label, page }) => (
              <button
                key={page}
                onClick={() => nav(page)}
                className={`px-2.5 py-2 rounded-[10px] font-['Poppins',sans-serif] font-medium text-[12px] transition-all ${
                  activePage === page
                    ? "bg-[#e0f2f0] text-[#089D97]"
                    : "text-[#1a2e2d]/55 hover:text-[#089D97] hover:bg-[#f0f9f8]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            aria-label={t("common_toggle_language")}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] text-[#1a2e2d]/60 hover:text-[#089D97] hover:bg-[#f0f9f8] transition-all font-['Poppins',sans-serif] text-[13px] font-medium"
          >
            <Globe size={15} />
            <span>{lang === "en" ? "ع" : "EN"}</span>
          </button>

          {/* Dark / Light toggle */}
          <button
            onClick={toggleTheme}
            aria-label={t("common_toggle_theme")}
            className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[#1a2e2d]/60 hover:text-[#089D97] hover:bg-[#f0f9f8] transition-all"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {canUseShopping && (
            <button
              onClick={() => nav("cart")}
              aria-label={t("cart_title")}
              className="relative hidden sm:flex w-9 h-9 rounded-[10px] items-center justify-center text-[#1a2e2d]/60 hover:text-[#089D97] hover:bg-[#f0f9f8] transition-all"
            >
              <ShoppingCart size={17} />
              {count > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#089D97] text-white text-[10px] font-bold flex items-center justify-center">{count}</span>}
            </button>
          )}

          {isAuthenticated && (
            <div className="relative hidden sm:block" ref={notificationRef}>
              <button
                onClick={() => {
                  setNotificationsOpen((open) => !open);
                  setDropdownOpen(false);
                }}
                aria-label={t("nav_notifications")}
                aria-expanded={notificationsOpen}
                className="relative flex w-9 h-9 rounded-[10px] items-center justify-center text-[#1a2e2d]/60 hover:text-[#089D97] hover:bg-[#f0f9f8] transition-all"
              >
                <Bell size={17} />
                {unreadNotifications > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">{unreadNotifications}</span>}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-3 w-[340px] max-w-[calc(100vw-2rem)] bg-white rounded-[18px] shadow-2xl border border-[rgba(8,157,151,0.12)] overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-[#f0f8f7] flex items-center justify-between gap-3">
                    <div>
                      <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#1a2e2d]">{t("notif_title")}</p>
                      <p className="font-['Poppins',sans-serif] text-[11px] text-[#5a8a87]">{unreadNotifications} {t("notif_unread").toLowerCase()}</p>
                    </div>
                    {unreadNotifications > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="flex items-center gap-1.5 text-[#089D97] font-['Poppins',sans-serif] text-[11px] font-medium hover:underline"
                      >
                        <CheckCheck size={13} /> {t("notif_mark_all")}
                      </button>
                    )}
                  </div>

                  {previewNotifications.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="font-['Poppins',sans-serif] font-medium text-[13px] text-[#1a2e2d]">{t("notif_none")}</p>
                      <p className="font-['Poppins',sans-serif] text-[12px] text-[#5a8a87] mt-1">{t("notif_caught_up")}</p>
                    </div>
                  ) : (
                    <div className="max-h-[280px] overflow-y-auto">
                      {previewNotifications.map((item) => (
                        <div key={item.id} className={`px-4 py-3 border-b border-[#f0f8f7] last:border-b-0 ${item.isRead ? "bg-white" : "bg-[#f0f8f7]"}`}>
                          <div className="flex items-start gap-3">
                            <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${item.isRead ? "bg-gray-200" : "bg-amber-500"}`} />
                            <div className="min-w-0">
                              <p className="font-['Poppins',sans-serif] font-semibold text-[13px] text-[#1a2e2d] truncate">{item.title}</p>
                              <p className="font-['Poppins',sans-serif] text-[12px] text-[#5a8a87] leading-snug line-clamp-2">{item.message}</p>
                              <p className="font-['Poppins',sans-serif] text-[10px] text-black/35 mt-1">{new Date(item.createdAt).toLocaleString(lang === "ar" ? "ar-JO" : "en-US")}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => nav("notifications")}
                    className="w-full px-4 py-3 bg-white hover:bg-[#f0f8f7] text-[#089D97] font-['Poppins',sans-serif] text-[13px] font-semibold transition-colors"
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </div>
          )}

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
                      <LogOut size={15} /> {t("nav_logout")}
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
                {t("nav_login")}
              </button>
              <button
                onClick={() => nav("signup")}
                className="flex items-center gap-2 px-4 py-2 bg-[#089D97] text-white font-['Poppins',sans-serif] font-medium text-[14px] rounded-[10px] hover:bg-[#047975] transition-colors"
              >
                <PawPrint size={15} /> {t("nav_signup")}
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
          {visibleNavLinks.map(({ label, page }) => (
            <button
              key={page}
              onClick={() => nav(page === "home" && isAuthenticated ? dashboardPage : page)}
              className="text-start px-3 py-2.5 rounded-[10px] font-['Poppins',sans-serif] font-medium text-[15px] text-[#1a2e2d]/70 hover:bg-[#f0f9f8] hover:text-[#089D97] transition-colors"
            >
              {label}
            </button>
          ))}
          <div className="border-t border-[#f0f8f7] mt-1 pt-1">
            {LEGAL_LINKS.map(({ label, page }) => (
              <button
                key={page}
                onClick={() => nav(page)}
                className="text-start px-3 py-2 rounded-[10px] font-['Poppins',sans-serif] font-medium text-[13px] text-[#1a2e2d]/60 hover:bg-[#f0f9f8] hover:text-[#089D97] transition-colors"
              >
                {label}
              </button>
            ))}
          </div>

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
              <button onClick={() => nav("user-profile")} className="text-start px-3 py-2.5 rounded-[10px] font-['Poppins',sans-serif] text-[14px] text-[#1a2e2d]/70 hover:bg-[#f0f9f8]">{t("nav_profile")}</button>
	              <button onClick={() => nav("settings")} className="text-start px-3 py-2.5 rounded-[10px] font-['Poppins',sans-serif] text-[14px] text-[#1a2e2d]/70 hover:bg-[#f0f9f8]">{t("nav_settings")}</button>
	              <button onClick={() => nav("notifications")} className="text-start px-3 py-2.5 rounded-[10px] font-['Poppins',sans-serif] text-[14px] text-[#1a2e2d]/70 hover:bg-[#f0f9f8]">{t("nav_notifications")} ({unreadNotifications})</button>
              {canUseShopping && (
                <button onClick={() => nav("cart")} className="text-start px-3 py-2.5 rounded-[10px] font-['Poppins',sans-serif] text-[14px] text-[#1a2e2d]/70 hover:bg-[#f0f9f8]">{t("cart_title")} ({count})</button>
              )}
              <button onClick={handleLogout} className="mt-1 px-3 py-2.5 bg-rose-50 text-rose-600 font-['Poppins',sans-serif] font-medium text-[14px] rounded-[10px] text-center hover:bg-rose-100 transition-colors">
                {t("nav_logout")}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => nav("login")} className="mt-1 px-3 py-2.5 border border-[#089D97] text-[#089D97] font-['Poppins',sans-serif] font-medium text-[14px] rounded-[10px] text-center hover:bg-[#e0f2f0] transition-colors">
                {t("nav_login")}
              </button>
              <button onClick={() => nav("signup")} className="mt-1 px-3 py-2.5 bg-[#089D97] text-white font-['Poppins',sans-serif] font-medium text-[14px] rounded-[10px] text-center hover:bg-[#047975] transition-colors">
                {t("nav_signup")}
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
