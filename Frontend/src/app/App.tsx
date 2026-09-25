import { useText } from "../i18n/useText";
import UploadProgress from "../components/UploadProgress";
import { lazy, Suspense, useState, useEffect } from "react";
import { Toaster } from "sonner";
import { CartProvider } from "../context/CartContext";
import { AuthProvider, useAuth, UserRole } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { LanguageProvider, useLanguage } from "../context/LanguageContext";
import { useNotificationSocket } from "../hooks/useNotificationSocket";

import SystemStatusPage from "../pages/SystemStatusPage";
import HomePage from "../pages/HomePage";
import AboutPage from "../pages/AboutPage";
import TermsPage from "../pages/TermsPage";
import PrivacyPolicyPage from "../pages/PrivacyPolicyPage";
import LoginPage from "../pages/LoginPage";
import OAuthCallbackPage from "../pages/OAuthCallbackPage";
import SignUpPage from "../pages/SignUpPage";
import VerifyEmailPage from "../pages/VerifyEmailPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import PetsListPage from "../pages/PetsListPage";
import PetDetailPage from "../pages/PetDetailPage";
import ShopPage from "../pages/ShopPage";
import CartPage from "../pages/CartPage";
import NotificationsPage from "../pages/NotificationsPage";
import UserProfilePage from "../pages/UserProfilePage";
import SettingsPage from "../pages/SettingsPage";
import DashboardLayout from "../components/DashboardLayout";

const MyRequestsPage = lazy(() => import("../pages/adopter/MyRequestsPage"));
const OrdersPage = lazy(() => import("../pages/adopter/OrdersPage"));
const MyAdoptionsPage = lazy(() => import("../pages/adopter/MyAdoptionsPage"));
const ChatsListPage = lazy(() => import("../pages/adopter/ChatsListPage"));
const ChatDetailPage = lazy(() => import("../pages/adopter/ChatDetailPage"));
const AdopterDashboardPage = lazy(() => import("../pages/adopter/AdopterDashboardPage"));

const StaffDashboardPage = lazy(() => import("../pages/staff/StaffDashboardPage"));
const StaffPetsPage = lazy(() => import("../pages/staff/StaffPetsPage"));
const StaffRequestsPage = lazy(() => import("../pages/staff/StaffRequestsPage"));
const StaffAdoptionsPage = lazy(() => import("../pages/staff/StaffAdoptionsPage"));
const StaffChatsListPage = lazy(() => import("../pages/staff/StaffChatsListPage"));
const StaffChatDetailPage = lazy(() => import("../pages/staff/StaffChatDetailPage"));
const CommunityPage = lazy(() => import("../pages/CommunityPage"));
const SocialFriendsPage = lazy(() => import("../pages/FriendsPage"));
const DirectChatPage = lazy(() => import("../pages/DirectChatPage"));

const VetDashboardPage = lazy(() => import("../pages/vet/VetDashboardPage"));
const VetPetsPage = lazy(() => import("../pages/vet/VetPetsPage"));
const VetMedicalPage = lazy(() => import("../pages/vet/VetMedicalPage"));
const VetVaccinationsPage = lazy(() => import("../pages/vet/VetVaccinationsPage"));
const VetProfilePage = lazy(() => import("../pages/vet/VetProfilePage"));

const ManagerDashboardPage = lazy(() => import("../pages/manager/ManagerDashboardPage"));
const ManagerAnalyticsPage = lazy(() => import("../pages/manager/ManagerAnalyticsPage"));
const ManagerInventoryPage = lazy(() => import("../pages/manager/ManagerInventoryPage"));

const AdminDashboardPage = lazy(() => import("../pages/admin/AdminDashboardPage"));
const AdminUsersPage = lazy(() => import("../pages/admin/AdminUsersPage"));
const AdminInventoryPage = lazy(() => import("../pages/admin/AdminInventoryPage"));
const AdminSuppliersPage = lazy(() => import("../pages/admin/AdminSuppliersPage"));
const AdminReportsPage = lazy(() => import("../pages/admin/AdminReportsPage"));
const AdminAnalyticsPage = lazy(() => import("../pages/admin/AdminAnalyticsPage"));
const AdminRolesPage = lazy(() => import("../pages/admin/AdminRolesPage"));
const AdminFilesPage = lazy(() => import("../pages/admin/AdminFilesPage"));
const ActivityLogPage = lazy(() => import("../pages/admin/ActivityLogPage"));
const AdminDepartmentsPage = lazy(() => import("../pages/admin/AdminDepartmentsPage"));
const AdminOrdersPage = lazy(() => import("../pages/admin/AdminOrdersPage"));

export type Role = UserRole;

function RouteLoadingFallback() {
  const tx = useText();
  return (
    <div className="min-h-screen bg-[#f0f8f7] flex items-center justify-center font-['Poppins',sans-serif] text-[#089D97]">{tx("Loading...")}</div>
  );
}

// Pages anyone can view without logging in.
const PUBLIC_PAGES = new Set<string>([
  "home", "login", "signup", "status", "about", "terms",
  "privacy", "forgot-password", "reset-password", "pets", "pet-detail",
  "oauth-callback", "verify-email",
]);

// Pages restricted to specific roles.
const ROLE_PAGES: Record<string, UserRole[]> = {
  about: ["adopter"],
  pets: ["adopter"],
  "pet-detail": ["adopter", "employee", "vet", "manager", "admin"],
  shop: ["adopter"],
  cart: ["adopter"],
  orders: ["adopter"],
  "adopter-dashboard": ["adopter"],
  profile: ["adopter"],
  "my-requests": ["adopter"],
  "my-adoptions": ["adopter"],
  chats: ["adopter"],
  friends: ["adopter"],
  "support-chat": ["adopter"],
  community: ["adopter", "employee", "vet", "manager", "admin"],
  "chat-detail": ["adopter"],
  "user-profile": ["adopter", "employee", "vet", "manager", "admin"],
  settings: ["adopter", "employee", "vet", "manager", "admin"],
  notifications: ["adopter", "employee", "vet", "manager", "admin"],
  "staff-dashboard": ["employee"],
  "staff-pets": ["employee"],
  "staff-requests": ["employee"],
  "staff-adoptions": ["employee"],
  "staff-chats": ["employee"],
  "staff-chat-detail": ["employee"],
  "staff-orders": ["employee"],
  "staff-inventory": ["employee"],
  "staff-suppliers": ["employee"],
  "staff-reports": ["employee"],
  "staff-friends": ["employee"],
  "vet-dashboard": ["vet"],
  "vet-pets": ["vet"],
  "vet-medical": ["vet"],
  "vet-vaccinations": ["vet"],
  "vet-reports": ["vet"],
  "vet-profile": ["vet"],
  "vet-friends": ["vet"],
  "manager-dashboard": ["manager"],
  "manager-pets": ["manager"],
  "manager-requests": ["manager"],
  "manager-adoptions": ["manager"],
  "manager-chats": ["manager"],
  "manager-chat-detail": ["manager"],
  "manager-users": ["manager"],
  "manager-orders": ["manager"],
  "manager-analytics": ["manager"],
  "manager-inventory": ["manager"],
  "manager-suppliers": ["manager"],
  "manager-reports": ["manager"],
  "manager-friends": ["manager"],
  "admin-dashboard": ["admin"],
  "admin-pets": ["admin"],
  "admin-requests": ["admin"],
  "admin-adoptions": ["admin"],
  "admin-chats": ["admin"],
  "admin-chat-detail": ["admin"],
  "admin-users": ["admin"],
  "admin-departments": ["admin"],
  "admin-orders": ["admin"],
  "admin-inventory": ["admin"],
  "admin-suppliers": ["admin"],
  "admin-reports": ["admin"],
  "admin-analytics": ["admin"],
  "admin-roles": ["admin"],
  "admin-files": ["admin"],
  "admin-activity": ["admin"],
  "admin-friends": ["admin"],
};

function homePageForRole(role: UserRole): string {
  switch (role) {
    case "admin": return "admin-dashboard";
    case "manager": return "manager-dashboard";
    case "employee": return "staff-dashboard";
    case "vet": return "vet-dashboard";
    default: return "adopter-dashboard";
  }
}

type Params = Record<string, unknown>;

function AppRouter() {
  const { user, isAuthenticated, loading, logout, setReturnTo } = useAuth();
  const { t } = useLanguage();
  const initialRoute = readHashRoute();
  const [currentPage, setCurrentPage] = useState<string>(initialRoute.page);
  const [params, setParams] = useState<Params>(initialRoute.params);
  useNotificationSocket(user?.id);

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
  // redirect authenticated users away from home/login to their role landing page.
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

    // Redirect authenticated users away from public "home" to their role landing page.
    if (target === "home" && isAuthenticated && user) {
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
    return <div className="min-h-screen bg-[#f0f8f7] flex items-center justify-center font-['Poppins',sans-serif] text-[#089D97]">{t("common_loading")}</div>;
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
  if ((page === "pet-detail" || page === "vet-medical" || page === "vet-vaccinations") && parts[1]) params.petId = parts[1];
  if ((page === "chat-detail" || page === "staff-chat-detail" || page === "manager-chat-detail" || page === "admin-chat-detail") && parts[1]) params.conversationId = parts[1];
  return { page, params };
}

function writeHashRoute(page: string, params: Params) {
  const pathParam =
    page === "pet-detail" || page === "vet-medical" || page === "vet-vaccinations" ? params.petId :
    page === "chat-detail" || page === "staff-chat-detail" || page === "manager-chat-detail" || page === "admin-chat-detail" ? params.conversationId :
    undefined;
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value == null || key === "petId" || key === "conversationId") return;
    query.set(key, String(value));
  });
  const next = `#/${page}${pathParam ? `/${pathParam}` : ""}${query.toString() ? `?${query}` : ""}`;
  if (window.location.hash !== next) window.location.hash = next;
}

function renderPage(page: string, navigate: (p: string, params?: Params) => void, params: Params, userRole?: UserRole) {
  switch (page) {
    // Public
    case "home": return <HomePage onNavigate={navigate} />;
    case "about": return userRole === "adopter"
      ? <DashboardLayout role="adopter" activePage="about" onNavigate={navigate}><AboutPage onNavigate={navigate} embedded /></DashboardLayout>
      : <AboutPage onNavigate={navigate} />;
    case "terms": return <TermsPage onNavigate={navigate} />;
    case "privacy": return <PrivacyPolicyPage onNavigate={navigate} />;
    case "login": return <LoginPage onNavigate={navigate} />;
    case "oauth-callback": return <OAuthCallbackPage onNavigate={navigate} code={params.code as string | undefined} />;
    case "signup": return <SignUpPage onNavigate={navigate} />;
    case "verify-email": return <VerifyEmailPage onNavigate={navigate} token={params.token as string | undefined} email={params.email as string | undefined} />;
    case "forgot-password": return <ForgotPasswordPage onNavigate={navigate} email={params.email as string | undefined} />;
    case "reset-password": return <ResetPasswordPage onNavigate={navigate} token={params.token as string | undefined} />;
    case "pets": return userRole === "adopter"
      ? <DashboardLayout role="adopter" activePage="pets" onNavigate={navigate}><PetsListPage onNavigate={navigate} embedded /></DashboardLayout>
      : <PetsListPage onNavigate={navigate} />;
    case "pet-detail": return userRole === "adopter"
      ? <DashboardLayout role="adopter" activePage="pets" onNavigate={navigate}><PetDetailPage onNavigate={navigate} petId={params.petId as string} embedded /></DashboardLayout>
      : <PetDetailPage onNavigate={navigate} petId={params.petId as string} />;
    case "shop": return userRole === "adopter"
      ? <DashboardLayout role="adopter" activePage="shop" onNavigate={navigate}><ShopPage onNavigate={navigate} embedded /></DashboardLayout>
      : <ShopPage onNavigate={navigate} />;
    case "status":
      return <SystemStatusPage onNavigate={navigate} />;
    // Shared authenticated
    case "cart": return userRole === "adopter"
      ? <DashboardLayout role="adopter" activePage="shop" onNavigate={navigate}><CartPage onNavigate={navigate} embedded /></DashboardLayout>
      : <CartPage onNavigate={navigate} />;
    case "orders": return <OrdersPage onNavigate={navigate} orderId={params.orderId as string | undefined} />;
    case "user-profile": return userRole === "adopter"
      ? <DashboardLayout role="adopter" activePage="user-profile" onNavigate={navigate}><UserProfilePage onNavigate={navigate} embedded /></DashboardLayout>
      : <UserProfilePage onNavigate={navigate} />;
    case "settings": return userRole === "adopter"
      ? <DashboardLayout role="adopter" activePage="settings" onNavigate={navigate}><SettingsPage onNavigate={navigate} embedded /></DashboardLayout>
      : <SettingsPage onNavigate={navigate} />;
    case "notifications": return <NotificationsPage onNavigate={navigate} role={userRole ?? "adopter"} />;

    case "adopter-dashboard": return <DashboardLayout role="adopter" activePage="adopter-dashboard" onNavigate={navigate}><AdopterDashboardPage onNavigate={navigate} /></DashboardLayout>;
    case "profile": return userRole === "adopter"
      ? <DashboardLayout role="adopter" activePage="user-profile" onNavigate={navigate}><UserProfilePage onNavigate={navigate} embedded /></DashboardLayout>
      : <UserProfilePage onNavigate={navigate} />;
    case "my-requests": return <MyRequestsPage onNavigate={navigate} />;
    case "my-adoptions": return <MyAdoptionsPage onNavigate={navigate} />;
    case "chats": return <DirectChatPage key={params.id as string ?? "list"} onNavigate={navigate} conversationId={params.id as string | undefined} />;
    case "support-chat": return <ChatsListPage onNavigate={navigate} />;
    case "friends": return <SocialFriendsPage onNavigate={navigate} />;
    case "community": return <CommunityPage onNavigate={navigate} />;
    case "chat-detail": return <ChatDetailPage onNavigate={navigate} conversationId={params.conversationId as string} />;

    // Employee
    case "staff-dashboard": return <StaffDashboardPage onNavigate={navigate} />;
    case "staff-pets": return <StaffPetsPage onNavigate={navigate} />;
    case "staff-requests": return <StaffRequestsPage onNavigate={navigate} />;
    case "staff-adoptions": return <StaffAdoptionsPage onNavigate={navigate} />;
    case "staff-chats": return <StaffChatsListPage onNavigate={navigate} />;
    case "staff-chat-detail": return <StaffChatDetailPage onNavigate={navigate} conversationId={params.conversationId as string} />;
    case "staff-orders": return <AdminOrdersPage onNavigate={navigate} role="employee" activePage="staff-orders" />;
    case "staff-inventory": return <AdminInventoryPage onNavigate={navigate} role="employee" activePage="staff-inventory" />;
    case "staff-suppliers": return <AdminSuppliersPage onNavigate={navigate} role="employee" activePage="staff-suppliers" />;
    case "staff-reports": return <AdminReportsPage onNavigate={navigate} role="employee" activePage="staff-reports" />;
    case "staff-friends": return <CommunityPage onNavigate={navigate} />;

    // Vet
    case "vet-dashboard": return <VetDashboardPage onNavigate={navigate} />;
    case "vet-pets": return <VetPetsPage onNavigate={navigate} />;
    case "vet-medical": return <VetMedicalPage onNavigate={navigate} params={{ petId: params.petId as string | undefined }} />;
    case "vet-vaccinations": return <VetVaccinationsPage onNavigate={navigate} params={{ petId: params.petId as string | undefined }} />;
    case "vet-reports": return <AdminReportsPage onNavigate={navigate} role="vet" activePage="vet-reports" />;
    case "vet-profile": return <VetProfilePage onNavigate={navigate} />;
    case "vet-friends": return <CommunityPage onNavigate={navigate} />;

    // Manager
    case "manager-dashboard": return <ManagerDashboardPage onNavigate={navigate} />;
    case "manager-pets": return <StaffPetsPage onNavigate={navigate} role="manager" activePage="manager-pets" />;
    case "manager-requests": return <StaffRequestsPage onNavigate={navigate} role="manager" activePage="manager-requests" />;
    case "manager-adoptions": return <StaffAdoptionsPage onNavigate={navigate} role="manager" activePage="manager-adoptions" />;
    case "manager-chats": return <StaffChatsListPage onNavigate={navigate} role="manager" activePage="manager-chats" detailPage="manager-chat-detail" />;
    case "manager-chat-detail": return <StaffChatDetailPage onNavigate={navigate} conversationId={params.conversationId as string} role="manager" activePage="manager-chats" listPage="manager-chats" />;
    case "manager-users": return <AdminUsersPage onNavigate={navigate} role="manager" activePage="manager-users" />;
    case "manager-orders": return <AdminOrdersPage onNavigate={navigate} role="manager" activePage="manager-orders" />;
    case "manager-analytics": return <ManagerAnalyticsPage onNavigate={navigate} />;
    case "manager-inventory": return <ManagerInventoryPage onNavigate={navigate} />;
    case "manager-suppliers": return <AdminSuppliersPage onNavigate={navigate} role="manager" activePage="manager-suppliers" />;
    case "manager-reports": return <AdminReportsPage onNavigate={navigate} role="manager" activePage="manager-reports" />;
    case "manager-friends": return <CommunityPage onNavigate={navigate} />;

    // Admin
    case "admin-dashboard": return <AdminDashboardPage onNavigate={navigate} />;
    case "admin-pets": return <StaffPetsPage onNavigate={navigate} role="admin" activePage="admin-pets" />;
    case "admin-requests": return <StaffRequestsPage onNavigate={navigate} role="admin" activePage="admin-requests" />;
    case "admin-adoptions": return <StaffAdoptionsPage onNavigate={navigate} role="admin" activePage="admin-adoptions" />;
    case "admin-chats": return <StaffChatsListPage onNavigate={navigate} role="admin" activePage="admin-chats" detailPage="admin-chat-detail" />;
    case "admin-chat-detail": return <StaffChatDetailPage onNavigate={navigate} conversationId={params.conversationId as string} role="admin" activePage="admin-chats" listPage="admin-chats" />;
    case "admin-users": return <AdminUsersPage onNavigate={navigate} />;
    case "admin-departments": return <AdminDepartmentsPage onNavigate={navigate} />;
    case "admin-orders": return <AdminOrdersPage onNavigate={navigate} />;
    case "admin-inventory": return <AdminInventoryPage onNavigate={navigate} role="admin" activePage="admin-inventory" />;
    case "admin-suppliers": return <AdminSuppliersPage onNavigate={navigate} />;
    case "admin-reports": return <AdminReportsPage onNavigate={navigate} />;
    case "admin-analytics": return <AdminAnalyticsPage onNavigate={navigate} />;
    case "admin-roles": return <AdminRolesPage onNavigate={navigate} />;
    case "admin-files": return <AdminFilesPage onNavigate={navigate} />;
    case "admin-activity": return <ActivityLogPage onNavigate={navigate} />;
    case "admin-friends": return <CommunityPage onNavigate={navigate} />;

    default: return <HomePage onNavigate={navigate} />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <CartProvider>
            <UploadProgress />
            <Toaster position="top-center" richColors />
            <Suspense fallback={<RouteLoadingFallback />}>
              <AppRouter />
            </Suspense>
          </CartProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
