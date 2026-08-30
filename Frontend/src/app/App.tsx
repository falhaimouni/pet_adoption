import { useState, useEffect } from "react";
import { CartProvider } from "../context/CartContext";
import { WishlistProvider } from "../context/WishlistContext";
import { AuthProvider, useAuth, UserRole } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { LanguageProvider } from "../context/LanguageContext";

import HomePage from "../pages/HomePage";
import AboutPage from "../pages/AboutPage";
import TermsPage from "../pages/TermsPage";
import PrivacyPolicyPage from "../pages/PrivacyPolicyPage";
import LoginPage from "../pages/LoginPage";
import SignUpPage from "../pages/SignUpPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import PetsListPage from "../pages/PetsListPage";
import PetDetailPage from "../pages/PetDetailPage";
import ShopPage from "../pages/ShopPage";
import CartPage from "../pages/CartPage";
import WishlistPage from "../pages/WishlistPage";
import NotificationsPage from "../pages/NotificationsPage";
import UserProfilePage from "../pages/UserProfilePage";
import SettingsPage from "../pages/SettingsPage";

// Adopter pages
import ProfilePage from "../pages/adopter/ProfilePage";
import MyRequestsPage from "../pages/adopter/MyRequestsPage";
import MyAdoptionsPage from "../pages/adopter/MyAdoptionsPage";
import ChatsListPage from "../pages/adopter/ChatsListPage";
import ChatDetailPage from "../pages/adopter/ChatDetailPage";

// Staff pages
import StaffDashboardPage from "../pages/staff/StaffDashboardPage";
import StaffPetsPage from "../pages/staff/StaffPetsPage";
import StaffRequestsPage from "../pages/staff/StaffRequestsPage";
import StaffAdoptionsPage from "../pages/staff/StaffAdoptionsPage";
import StaffChatsListPage from "../pages/staff/StaffChatsListPage";
import StaffChatDetailPage from "../pages/staff/StaffChatDetailPage";

// Vet pages
import VetDashboardPage from "../pages/vet/VetDashboardPage";
import VetPetsPage from "../pages/vet/VetPetsPage";
import VetMedicalPage from "../pages/vet/VetMedicalPage";
import VetVaccinationsPage from "../pages/vet/VetVaccinationsPage";
import VetProfilePage from "../pages/vet/VetProfilePage";
import VetAppointmentsPage from "../pages/vet/VetAppointmentsPage";
import VetAppointmentDetailPage from "../pages/vet/VetAppointmentDetailPage";

// Manager pages
import ManagerDashboardPage from "../pages/manager/ManagerDashboardPage";
import ManagerAnalyticsPage from "../pages/manager/ManagerAnalyticsPage";
import ManagerInventoryPage from "../pages/manager/ManagerInventoryPage";

// Admin pages
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AdminInventoryPage from "../pages/admin/AdminInventoryPage";
import AdminSuppliersPage from "../pages/admin/AdminSuppliersPage";
import AdminReportsPage from "../pages/admin/AdminReportsPage";
import AdminAnalyticsPage from "../pages/admin/AdminAnalyticsPage";
import AdminRolesPage from "../pages/admin/AdminRolesPage";
import AdminFilesPage from "../pages/admin/AdminFilesPage";
import ActivityLogPage from "../pages/admin/ActivityLogPage";

export type Role = UserRole;

// Pages anyone can view without logging in.
const PUBLIC_PAGES = new Set<string>([
  "home", "login", "signup", "about", "terms",
  "privacy", "forgot-password", "reset-password", "pets", "pet-detail", "shop", "wishlist", "cart", "orders",
]);

// Pages restricted to specific roles.
const ROLE_PAGES: Record<string, UserRole[]> = {
  profile: ["adopter"],
  "my-requests": ["adopter"],
  "my-adoptions": ["adopter"],
  chats: ["adopter"],
  "chat-detail": ["adopter"],
  "user-profile": ["adopter", "staff", "vet", "manager", "admin"],
  settings: ["adopter", "staff", "vet", "manager", "admin"],
  notifications: ["adopter", "staff", "vet", "manager", "admin"],
  "staff-dashboard": ["staff"],
  "staff-pets": ["staff"],
  "staff-requests": ["staff"],
  "staff-adoptions": ["staff"],
  "staff-chats": ["staff"],
  "staff-chat-detail": ["staff"],
  "staff-inventory": ["staff"],
  "vet-dashboard": ["vet"],
  "vet-pets": ["vet"],
  "vet-medical": ["vet"],
  "vet-vaccinations": ["vet"],
  "vet-appointments": ["vet"],
  "vet-appointment-detail": ["vet"],
  "vet-profile": ["vet"],
  "manager-dashboard": ["manager"],
  "manager-pets": ["manager"],
  "manager-analytics": ["manager"],
  "manager-inventory": ["manager"],
  "admin-dashboard": ["admin"],
  "admin-pets": ["admin"],
  "admin-users": ["admin"],
  "admin-inventory": ["admin"],
  "admin-suppliers": ["admin"],
  "admin-reports": ["admin"],
  "admin-analytics": ["admin"],
  "admin-roles": ["admin"],
  "admin-files": ["admin"],
  "admin-activity": ["admin"],
};

function homePageForRole(role: UserRole): string {
  switch (role) {
    case "admin": return "admin-dashboard";
    case "manager": return "manager-dashboard";
    case "staff": return "staff-dashboard";
    case "vet": return "vet-dashboard";
    default: return "pets";
  }
}

type Params = Record<string, unknown>;

function AppRouter() {
  const { user, isAuthenticated, loading, logout, setReturnTo } = useAuth();
  const initialRoute = readHashRoute();
  const [currentPage, setCurrentPage] = useState<string>(initialRoute.page);
  const [params, setParams] = useState<Params>(initialRoute.params);

  useEffect(() => {
    const onHashChange = () => {
      const route = readHashRoute();
      setCurrentPage(route.page);
      setParams(route.params);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // When auth state settles (login or page load with saved session),
  // redirect non-adopters away from home/login to their role dashboard.
  useEffect(() => {
    if (isAuthenticated && user && (currentPage === "home" || currentPage === "login")) {
      writeHashRoute(homePageForRole(user.role), {});
    }
  }, [isAuthenticated, user?.role, currentPage]);

  useEffect(() => {
    if (loading) return;
    if (!PUBLIC_PAGES.has(currentPage) && !isAuthenticated) {
      setReturnTo(currentPage);
      writeHashRoute("login", {});
      return;
    }
    if (isAuthenticated && user && ROLE_PAGES[currentPage] && !ROLE_PAGES[currentPage].includes(user.role)) {
      writeHashRoute(homePageForRole(user.role), {});
    }
  }, [currentPage, isAuthenticated, loading, setReturnTo, user]);

  const navigate = (page: string, newParams?: Params) => {
    if (page === "logout") {
      logout();
      writeHashRoute("login", {});
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    let target = page;

    // Redirect authenticated non-adopter users away from public "home" to their dashboard
    if (target === "home" && isAuthenticated && user && user.role !== "adopter") {
      target = homePageForRole(user.role);
    }

    if (!PUBLIC_PAGES.has(target) && !isAuthenticated) {
      setReturnTo(target);
      target = "login";
    } else if (isAuthenticated && user && ROLE_PAGES[target] && !ROLE_PAGES[target].includes(user.role)) {
      target = homePageForRole(user.role);
    }

    writeHashRoute(target, newParams ?? {});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return <div className="min-h-screen bg-[#f0f8f7] flex items-center justify-center font-['Poppins',sans-serif] text-[#089D97]">Loading...</div>;
  }

  return renderPage(currentPage, navigate, params, user?.role);
}

function readHashRoute(): { page: string; params: Params } {
  const raw = window.location.hash.replace(/^#\/?/, "");
  if (!raw) return { page: "home", params: {} };
  const [pathPart, queryPart] = raw.split("?");
  const parts = pathPart.split("/").filter(Boolean);
  const page = parts[0] || "home";
  const search = new URLSearchParams(queryPart ?? "");
  const params: Params = Object.fromEntries(search.entries());
  if (parts[1]) params.id = parts[1];
  if (page === "pet-detail" && parts[1]) params.petId = parts[1];
  if ((page === "chat-detail" || page === "staff-chat-detail") && parts[1]) params.conversationId = parts[1];
  if (page === "vet-appointment-detail" && parts[1]) params.appointmentId = parts[1];
  return { page, params };
}

function writeHashRoute(page: string, params: Params) {
  const pathParam =
    page === "pet-detail" ? params.petId :
    page === "chat-detail" || page === "staff-chat-detail" ? params.conversationId :
    page === "vet-appointment-detail" ? params.appointmentId :
    undefined;
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value == null || key === "petId" || key === "conversationId" || key === "appointmentId") return;
    query.set(key, String(value));
  });
  const next = `#/${page}${pathParam ? `/${pathParam}` : ""}${query.toString() ? `?${query}` : ""}`;
  if (window.location.hash !== next) window.location.hash = next;
}

function renderPage(page: string, navigate: (p: string, params?: Params) => void, params: Params, userRole?: UserRole) {
  switch (page) {
    // Public
    case "home": return <HomePage onNavigate={navigate} />;
    case "about": return <AboutPage onNavigate={navigate} />;
    case "terms": return <TermsPage onNavigate={navigate} />;
    case "privacy": return <PrivacyPolicyPage onNavigate={navigate} />;
    case "login": return <LoginPage onNavigate={navigate} />;
    case "signup": return <SignUpPage onNavigate={navigate} />;
    case "forgot-password": return <ForgotPasswordPage onNavigate={navigate} />;
    case "reset-password": return <ResetPasswordPage onNavigate={navigate} token={params.token as string | undefined} />;
    case "pets": return <PetsListPage onNavigate={navigate} />;
    case "pet-detail": return <PetDetailPage onNavigate={navigate} petId={params.petId as string} />;
    case "shop": return <ShopPage onNavigate={navigate} />;
    case "wishlist": return <WishlistPage onNavigate={navigate} />;

    // Shared authenticated
    case "cart": return <CartPage onNavigate={navigate} />;
    case "orders": return <CartPage onNavigate={navigate} />;
    case "user-profile": return <UserProfilePage onNavigate={navigate} />;
    case "settings": return <SettingsPage onNavigate={navigate} />;
    case "notifications": return <NotificationsPage onNavigate={navigate} role={userRole ?? "adopter"} />;

    case "profile": return <ProfilePage onNavigate={navigate} />;
    case "my-requests": return <MyRequestsPage onNavigate={navigate} />;
    case "my-adoptions": return <MyAdoptionsPage onNavigate={navigate} />;
    case "chats": return <ChatsListPage onNavigate={navigate} />;
    case "chat-detail": return <ChatDetailPage onNavigate={navigate} conversationId={params.conversationId as string} />;

    // Staff
    case "staff-dashboard": return <StaffDashboardPage onNavigate={navigate} />;
    case "staff-pets": return <StaffPetsPage onNavigate={navigate} />;
    case "staff-requests": return <StaffRequestsPage onNavigate={navigate} />;
    case "staff-adoptions": return <StaffAdoptionsPage onNavigate={navigate} />;
    case "staff-chats": return <StaffChatsListPage onNavigate={navigate} />;
    case "staff-chat-detail": return <StaffChatDetailPage onNavigate={navigate} conversationId={params.conversationId as string} />;
    case "staff-inventory": return <AdminInventoryPage onNavigate={navigate} role="staff" activePage="staff-inventory" />;

    // Vet
    case "vet-dashboard": return <VetDashboardPage onNavigate={navigate} />;
    case "vet-pets": return <VetPetsPage onNavigate={navigate} />;
    case "vet-medical": return <VetMedicalPage onNavigate={navigate} />;
    case "vet-vaccinations": return <VetVaccinationsPage onNavigate={navigate} />;
    case "vet-appointments": return <VetAppointmentsPage onNavigate={navigate} />;
    case "vet-appointment-detail": return <VetAppointmentDetailPage onNavigate={navigate} />;
    case "vet-profile": return <VetProfilePage onNavigate={navigate} />;

    // Manager
    case "manager-dashboard": return <ManagerDashboardPage onNavigate={navigate} />;
    case "manager-pets": return <StaffPetsPage onNavigate={navigate} role="manager" activePage="manager-pets" />;
    case "manager-analytics": return <ManagerAnalyticsPage onNavigate={navigate} />;
    case "manager-inventory": return <ManagerInventoryPage onNavigate={navigate} />;

    // Admin
    case "admin-dashboard": return <AdminDashboardPage onNavigate={navigate} />;
    case "admin-pets": return <StaffPetsPage onNavigate={navigate} role="admin" activePage="admin-pets" />;
    case "admin-users": return <AdminUsersPage onNavigate={navigate} />;
    case "admin-inventory": return <AdminInventoryPage onNavigate={navigate} role="admin" activePage="admin-inventory" />;
    case "admin-suppliers": return <AdminSuppliersPage onNavigate={navigate} />;
    case "admin-reports": return <AdminReportsPage onNavigate={navigate} />;
    case "admin-analytics": return <AdminAnalyticsPage onNavigate={navigate} />;
    case "admin-roles": return <AdminRolesPage onNavigate={navigate} />;
    case "admin-files": return <AdminFilesPage onNavigate={navigate} />;
    case "admin-activity": return <ActivityLogPage onNavigate={navigate} />;

    default: return <HomePage onNavigate={navigate} />;
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <AppRouter />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
