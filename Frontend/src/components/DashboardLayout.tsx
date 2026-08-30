import { useEffect, useState } from "react";
import {
  Home, User, Heart, Bell, Settings,
  LogOut, Menu, X, Syringe, BarChart2, Package, Users,
  FileText, ClipboardList, Stethoscope, Tag,
  ChevronRight, Sun, Moon, Globe, MessageCircle, FolderOpen, Shield, Activity, Calendar,
} from "lucide-react";
import logoImg from "../imports/MyPetopia/be6bd1f12e9a602c8830a9c39abaf73ad65d4682.png";
import profileImg from "../imports/MyPetopia/0ade9078bed97f834442fbb8c3bc4424aaf43269.png";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { apiFetch } from "../lib/api";

export type Role = "adopter" | "staff" | "vet" | "manager" | "admin";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

type TFn = (key: string) => string;

function getNavItems(role: Role, t: TFn): NavItem[] {
  switch (role) {
    case "adopter":
      return [
        { id: "profile",        label: t("nav_my_profile"),    icon: <User size={16} /> },
        { id: "my-requests",    label: t("nav_my_requests"),   icon: <ClipboardList size={16} /> },
        { id: "my-adoptions",   label: t("nav_my_adoptions"),  icon: <Heart size={16} /> },
        { id: "chats",          label: t("nav_chats"),         icon: <MessageCircle size={16} /> },
        { id: "wishlist",       label: t("wishlist_title"),    icon: <Heart size={16} /> },
        { id: "notifications",  label: t("nav_notifications"), icon: <Bell size={16} /> },
      ];
    case "staff":
      return [
        { id: "staff-dashboard",  label: t("nav_dashboard"),         icon: <Home size={16} /> },
        { id: "staff-pets",       label: t("dash_pets"),             icon: <Heart size={16} /> },
        { id: "staff-requests",   label: t("nav_adoption_requests"), icon: <ClipboardList size={16} /> },
        { id: "staff-adoptions",  label: t("nav_adoptions"),         icon: <Heart size={16} /> },
        { id: "staff-chats",      label: t("nav_chats"),             icon: <MessageCircle size={16} /> },
        { id: "staff-inventory",  label: t("nav_inventory"),         icon: <Package size={16} /> },
        { id: "notifications",    label: t("nav_notifications"),     icon: <Bell size={16} /> },
      ];
    case "vet":
      return [
        { id: "vet-dashboard",    label: t("nav_dashboard"),         icon: <Home size={16} /> },
        { id: "vet-pets",         label: t("dash_pets"),             icon: <Heart size={16} /> },
        { id: "vet-medical",      label: t("nav_medical_records"),   icon: <Stethoscope size={16} /> },
        { id: "vet-vaccinations", label: t("nav_vaccinations"),      icon: <Syringe size={16} /> },
        { id: "vet-appointments", label: t("nav_appointments"),      icon: <Calendar size={16} /> },
        { id: "notifications",    label: t("nav_notifications"),     icon: <Bell size={16} /> },
        { id: "vet-profile",      label: t("nav_my_profile"),        icon: <User size={16} /> },
      ];
    case "manager":
      return [
        { id: "manager-dashboard", label: t("nav_dashboard"),     icon: <Home size={16} /> },
        { id: "manager-pets",      label: t("dash_pets"),         icon: <Heart size={16} /> },
        { id: "manager-analytics", label: t("nav_analytics"),     icon: <BarChart2 size={16} /> },
        { id: "manager-inventory", label: t("nav_inventory"),     icon: <Package size={16} /> },
        { id: "notifications",     label: t("nav_notifications"), icon: <Bell size={16} /> },
      ];
    case "admin":
      return [
        { id: "admin-dashboard", label: t("nav_dashboard"),     icon: <Home size={16} /> },
        { id: "admin-pets",      label: t("dash_pets"),         icon: <Heart size={16} /> },
        { id: "admin-users",     label: t("nav_users"),         icon: <Users size={16} /> },
        { id: "admin-roles",     label: t("nav_roles"),         icon: <Shield size={16} /> },
        { id: "admin-inventory", label: t("nav_inventory"),     icon: <Package size={16} /> },
        { id: "admin-suppliers", label: t("nav_suppliers"),     icon: <Tag size={16} /> },
        { id: "admin-files",     label: t("nav_files"),         icon: <FolderOpen size={16} /> },
        { id: "admin-reports",   label: t("nav_reports"),       icon: <FileText size={16} /> },
        { id: "admin-analytics", label: t("nav_analytics"),     icon: <BarChart2 size={16} /> },
        { id: "admin-activity",  label: t("nav_activity_log"),  icon: <Activity size={16} /> },
        { id: "notifications",   label: t("nav_notifications"), icon: <Bell size={16} /> },
      ];
  }
}

function petsPageForRole(role: Role) {
  const map: Record<Role, string> = {
    adopter: "pets",
    staff: "staff-pets",
    vet: "vet-pets",
    manager: "manager-pets",
    admin: "admin-pets",
  };
  return map[role];
}

function getRoleLabel(role: Role, t: TFn) {
  const map: Record<Role, string> = {
    adopter: t("role_adopter"),
    staff:   t("role_staff"),
    vet:     t("role_vet"),
    manager: t("role_manager"),
    admin:   t("role_admin"),
  };
  return map[role];
}

interface DashboardLayoutProps {
  role: Role;
  activePage: string;
  onNavigate: (page: string) => void;
  userName?: string;
  children: React.ReactNode;
  pageTitle?: string;
  breadcrumbs?: string[];
}

export default function DashboardLayout({
  role,
  activePage,
  onNavigate,
  userName,
  children,
  pageTitle,
  breadcrumbs,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const displayName = userName ?? user?.name ?? "Guest";
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const navItems = getNavItems(role, t).map((item) =>
    item.id === "notifications" && unreadNotifications > 0
      ? { ...item, badge: unreadNotifications }
      : item
  );

  useEffect(() => {
    let cancelled = false;
    async function loadUnread() {
      try {
        const data = await apiFetch<{ count: number }>("/notifications/unread-count");
        if (!cancelled) setUnreadNotifications(Number(data.count ?? 0));
      } catch {
        if (!cancelled) setUnreadNotifications(0);
      }
    }

    void loadUnread();
    window.addEventListener("petopia:notifications-changed", loadUnread);
    return () => {
      cancelled = true;
      window.removeEventListener("petopia:notifications-changed", loadUnread);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[rgba(186,216,211,0.99)] flex flex-col">
      {/* Top Navbar */}
      <header className="w-full bg-white shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] z-20 relative">
        <div className="flex items-center justify-between h-[80px] px-4">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-black" onClick={() => setSidebarOpen((p) => !p)}>
              <Menu size={24} />
            </button>
            <img src={logoImg} alt="Petopia" className="h-[70px] w-auto object-contain" />
          </div>

          <div className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => onNavigate("home")}
              className="px-4 py-2 rounded-[10px] font-['Poppins',sans-serif] font-medium text-[15px] transition-all text-[#1a2e2d]/70 hover:text-[#089D97] hover:bg-[#f0f9f8]"
            >
              {t("dash_home")}
            </button>
            <button
              onClick={() => onNavigate(petsPageForRole(role))}
              className="px-4 py-2 rounded-[10px] font-['Poppins',sans-serif] font-medium text-[15px] transition-all text-[#1a2e2d]/70 hover:text-[#089D97] hover:bg-[#f0f9f8]"
            >
              {t("dash_pets")}
            </button>
          </div>

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

            <button onClick={() => onNavigate("notifications")} className="relative text-black hover:text-[#089D97] transition-colors" aria-label={t("nav_notifications")}>
              <Bell size={22} />
              {unreadNotifications > 0 && (
                <span className="absolute -top-2 -right-2 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-[46px] h-[46px] bg-[rgba(217,217,217,0.82)] rounded-full flex items-center justify-center overflow-hidden">
                <img src={profileImg} alt={t("profile_avatar_alt")} className="w-full h-full object-contain" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-['Poppins',sans-serif] font-medium text-[13px] text-black leading-tight">{displayName}</span>
                <span className="font-['Poppins',sans-serif] text-[11px] text-[#089D97]">{getRoleLabel(role, t)}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar overlay on mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed lg:relative top-0 lg:top-auto left-0 z-40 lg:z-auto
            w-[240px] bg-[#80bdba] rounded-r-[10px] lg:rounded-[10px]
            flex flex-col pt-4 pb-4 mt-0 lg:mt-[16px] lg:ml-[14px] mb-[16px]
            transition-transform duration-300 h-full lg:h-auto
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
          style={{ minHeight: "calc(100vh - 80px)" }}
        >
          <button className="lg:hidden absolute top-3 right-3 text-black" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>

          {/* Profile */}
          <div className="flex flex-col items-center px-4 pb-4 border-b border-white/30">
            <div className="w-[56px] h-[56px] bg-[rgba(217,217,217,0.82)] rounded-full flex items-center justify-center overflow-hidden mb-2">
              <img src={profileImg} alt={t("profile_avatar_alt")} className="w-full h-full object-contain" />
            </div>
            <p className="font-['Poppins',sans-serif] font-semibold text-[13px] text-black text-center">{displayName}</p>
            <span className="mt-1 px-3 py-0.5 bg-white/50 rounded-full font-['Poppins',sans-serif] text-[11px] text-[#047975]">
              {getRoleLabel(role, t)}
            </span>
          </div>

          {/* Menu */}
          <nav className="flex flex-col px-3 gap-1 mt-4 flex-1">
            <p className="font-['Poppins',sans-serif] font-medium text-[11px] text-black/60 mb-2 ml-1 uppercase tracking-wider">
              {t("dash_main_menu")}
            </p>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] font-['Poppins',sans-serif] font-medium text-[13px] transition-colors text-start ${
                  activePage === item.id
                    ? "bg-[#089D97] text-white"
                    : "text-black hover:bg-white/30"
                }`}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activePage === item.id ? "bg-white text-[#089D97]" : "bg-[#089D97] text-white"}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Settings + Logout */}
          <div className="px-3 flex flex-col gap-1 border-t border-white/30 pt-3 mt-3">
            <button
              onClick={() => { onNavigate("settings"); setSidebarOpen(false); }}
              className="flex items-center gap-3 px-3 py-2 rounded-[10px] font-['Poppins',sans-serif] font-medium text-[13px] text-black hover:bg-white/30 transition-colors"
            >
              <Settings size={16} />
              {t("dash_settings")}
            </button>
            <button
              onClick={() => onNavigate("logout")}
              className="flex items-center gap-3 px-3 py-2 rounded-[10px] font-['Poppins',sans-serif] font-medium text-[13px] text-black hover:bg-white/30 transition-colors"
            >
              <LogOut size={16} />
              {t("dash_logout")}
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-5">
          {/* Breadcrumb / Page title */}
          {(pageTitle || breadcrumbs) && (
            <div className="mb-4">
              {breadcrumbs && breadcrumbs.length > 1 && (
                <div className="flex items-center gap-1 mb-1">
                  {breadcrumbs.map((crumb, i) => (
                    <span key={i} className="flex items-center gap-1">
                      {i > 0 && <ChevronRight size={14} className="text-[#089D97]" />}
                      <span className={`font-['Poppins',sans-serif] text-[12px] ${i === breadcrumbs.length - 1 ? "text-[#089D97] font-medium" : "text-black/60"}`}>
                        {crumb}
                      </span>
                    </span>
                  ))}
                </div>
              )}
              {pageTitle && (
                <h1 className="font-['Poppins',sans-serif] font-semibold text-[22px] text-black">{pageTitle}</h1>
              )}
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
