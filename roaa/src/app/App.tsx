import { useState, useEffect } from "react";
import { CartProvider } from "../context/CartContext";
import { AuthProvider, useAuth, UserRole } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { LanguageProvider } from "../context/LanguageContext";

import HomePage from "../pages/HomePage";
import AboutPage from "../pages/AboutPage";
import TermsPage from "../pages/TermsPage";
import LoginPage from "../pages/LoginPage";
import SignUpPage from "../pages/SignUpPage";
import OAuthCallbackPage from "../pages/OAuthCallbackPage";
import PetsListPage from "../pages/PetsListPage";
import PetDetailPage from "../pages/PetDetailPage";
import ShopPage from "../pages/ShopPage";
import CartPage from "../pages/CartPage";
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
import VetAppointmentsPage from "../pages/vet/VetAppointmentsPage";
import VetAppointmentDetailPage from "../pages/vet/VetAppointmentDetailPage";
import VetProfilePage from "../pages/vet/VetProfilePage";

// Manager pages
import ManagerDashboardPage from "../pages/manager/ManagerDashboardPage";
import ManagerAnalyticsPage from "../pages/manager/ManagerAnalyticsPage";
import ManagerInventoryPage from "../pages/manager/ManagerInventoryPage";

// Admin pages
import AdminPetsPage from "../pages/admin/AdminPetsPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AdminRolesPage from "../pages/admin/AdminRolesPage";
import AdminInventoryPage from "../pages/admin/AdminInventoryPage";
import AdminSuppliersPage from "../pages/admin/AdminSuppliersPage";
import AdminFilesPage from "../pages/admin/AdminFilesPage";
import AdminReportsPage from "../pages/admin/AdminReportsPage";
import AdminAnalyticsPage from "../pages/admin/AdminAnalyticsPage";
import ActivityLogPage from "../pages/admin/ActivityLogPage";

export type Role = UserRole;

// Pages anyone can view without logging in.
const PUBLIC_PAGES = new Set<string>([
  "home", "login", "signup", "about", "terms",
  "oauth-google", "oauth-github",
]);

// Pages restricted to specific roles.
const ROLE_PAGES: Record<string, UserRole[]> = {
  profile: ["adopter"],
  "my-requests": ["adopter"],
  "my-adoptions": ["adopter"],
  "staff-dashboard": ["staff"],
  "staff-pets": ["staff"],
  "staff-requests": ["staff"],
  "staff-adoptions": ["staff"],
  "staff-chats": ["staff"],
  "staff-chat-detail": ["staff"],
  "vet-dashboard": ["vet"],
  "vet-pets": ["vet"],
  "vet-medical": ["vet"],
  "vet-vaccinations": ["vet"],
  "vet-appointments": ["vet"],
  "vet-appointment-detail": ["vet"],
  "vet-profile": ["vet"],
  "manager-dashboard": ["manager"],
  "manager-analytics": ["manager"],
  "manager-inventory": ["manager"],
  "admin-dashboard": ["admin"],
  "admin-pets": ["admin"],
  "admin-users": ["admin"],
  "admin-roles": ["admin"],
  "admin-inventory": ["admin"],
  "admin-suppliers": ["admin"],
  "admin-files": ["admin"],
  "admin-reports": ["admin"],
  "admin-analytics": ["admin"],
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
  const { user, isAuthenticated, logout, setReturnTo } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>("home");
  const [params, setParams] = useState<Params>({});

  // When auth state settles (login or page load with saved session),
  // redirect non-adopters away from home/login to their role dashboard.
  useEffect(() => {
    if (isAuthenticated && user && (currentPage === "home" || currentPage === "login")) {
      setCurrentPage(homePageForRole(user.role));
      setParams({});
    }
  }, [isAuthenticated, user?.role]);

  const navigate = (page: string, newParams?: Params) => {
    if (page === "logout") {
      logout();
      setCurrentPage("login");
      setParams({});
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

    setCurrentPage(target);
    setParams(newParams ?? {});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return renderPage(currentPage, navigate, params);
}

function renderPage(page: string, navigate: (p: string, params?: Params) => void, params: Params) {
  switch (page) {
    // Public
    case "home": return <HomePage onNavigate={navigate} />;
    case "about": return <AboutPage onNavigate={navigate} />;
    case "terms": return <TermsPage onNavigate={navigate} />;
    case "login": return <LoginPage onNavigate={navigate} />;
    case "signup": return <SignUpPage onNavigate={navigate} />;
    case "oauth-google": return <OAuthCallbackPage provider="google" onNavigate={navigate} />;
    case "oauth-github": return <OAuthCallbackPage provider="github" onNavigate={navigate} />;
    case "pets": return <PetsListPage onNavigate={navigate} />;
    case "pet-detail": return <PetDetailPage onNavigate={navigate} petId={params.petId as number} />;
    case "shop": return <ShopPage onNavigate={navigate} />;

    // Shared authenticated
    case "cart": return <CartPage onNavigate={navigate} />;
    case "orders": return <CartPage onNavigate={navigate} />;
    case "user-profile": return <UserProfilePage onNavigate={navigate} />;
    case "settings": return <SettingsPage onNavigate={navigate} />;
    case "notifications": return <NotificationsPage onNavigate={navigate} role="adopter" />;

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

    // Vet
    case "vet-dashboard": return <VetDashboardPage onNavigate={navigate} />;
    case "vet-pets": return <VetPetsPage onNavigate={navigate} />;
    case "vet-medical": return <VetMedicalPage onNavigate={navigate} />;
    case "vet-vaccinations": return <VetVaccinationsPage onNavigate={navigate} />;
    case "vet-appointments": return <VetAppointmentsPage onNavigate={navigate} />;
    case "vet-appointment-detail": return <VetAppointmentDetailPage onNavigate={navigate} params={params} />;
    case "vet-profile": return <VetProfilePage onNavigate={navigate} />;

    // Manager
    case "manager-dashboard": return <ManagerDashboardPage onNavigate={navigate} />;
    case "manager-analytics": return <ManagerAnalyticsPage onNavigate={navigate} />;
    case "manager-inventory": return <ManagerInventoryPage onNavigate={navigate} />;

    // Admin
    case "admin-dashboard": return <AdminDashboardPage onNavigate={navigate} />;
    case "admin-pets": return <AdminPetsPage onNavigate={navigate} />;
    case "admin-users": return <AdminUsersPage onNavigate={navigate} />;
    case "admin-roles": return <AdminRolesPage onNavigate={navigate} />;
    case "admin-inventory": return <AdminInventoryPage onNavigate={navigate} />;
    case "admin-suppliers": return <AdminSuppliersPage onNavigate={navigate} />;
    case "admin-files": return <AdminFilesPage onNavigate={navigate} />;
    case "admin-reports": return <AdminReportsPage onNavigate={navigate} />;
    case "admin-analytics": return <AdminAnalyticsPage onNavigate={navigate} />;
    case "admin-activity":
    case "activity-log": return <ActivityLogPage onNavigate={navigate} />;

    default: return <HomePage onNavigate={navigate} />;
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <AppRouter />
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

