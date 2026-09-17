import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ApiError, apiFetch, clearAuthTokens, resolveAssetUrl, setAuthTokens } from "../lib/api";

export type UserRole = "adopter" | "employee" | "vet" | "manager" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  username: string;
  role: UserRole;
  avatar?: string;
  provider?: "LOCAL" | "GOOGLE";
  status?: string;
  joinDate: string;
  lastLogin: string;
  phone?: string;
  city?: string;
  bio?: string;
  gender?: string;
  dob?: string;
  address?: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roleName: string;
  };
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  returnTo: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser | null>;
  completeGoogleLogin: (code: string) => Promise<AuthUser>;
  logout: () => void;
  setReturnTo: (page: string | null) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "petopia_auth_user";

function mapRole(roleName: string): UserRole {
  switch (roleName.toUpperCase()) {
    case "ADMIN": return "admin";
    case "MANAGER": return "manager";
    case "EMPLOYEE": return "employee";
    case "VET": return "vet";
    default: return "adopter";
  }
}

function mapAuthUser(response: AuthResponse): AuthUser {
  const { user } = response;
  const name = `${user.firstName} ${user.lastName}`.trim();
  return {
    id: user.id,
    email: user.email,
    name,
    username: user.email.split("@")[0],
    role: mapRole(user.roleName),
    joinDate: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };
}

type ProfileResponse = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  address?: string | null;
  avatar?: string | null;
  provider?: "LOCAL" | "GOOGLE";
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  role?: { roleName?: string };
};

function mapProfileUser(profile: ProfileResponse): AuthUser {
  const name = `${profile.firstName} ${profile.lastName}`.trim();
  return {
    id: profile.userId,
    email: profile.email,
    name,
    username: profile.email.split("@")[0],
    role: mapRole(profile.role?.roleName ?? "ADOPTER"),
    avatar: profile.avatar ? resolveAssetUrl(profile.avatar) : undefined,
    provider: profile.provider,
    status: profile.status,
    phone: profile.phone ?? undefined,
    address: profile.address ?? undefined,
    joinDate: profile.createdAt ?? new Date().toISOString(),
    lastLogin: profile.updatedAt ?? new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored) as AuthUser;
      return parsed.role === "staff" ? { ...parsed, role: "employee" } : parsed;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(Boolean(user));
  const [returnTo, setReturnTo] = useState<string | null>(null);

  const isAuthenticated = user !== null;

  useEffect(() => {
    localStorage.removeItem(STORAGE_KEY);
    if (user) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(STORAGE_KEY);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    apiFetch<ProfileResponse>("/users/profile")
      .then((profile) => {
        if (!cancelled) setUser(mapProfileUser(profile));
      })
      .catch(() => {
        if (!cancelled) {
          clearAuthTokens();
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function login(email: string, password: string): Promise<AuthUser | null> {
    try {
      const response = await apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setAuthTokens(response.accessToken, response.refreshToken);
      const profile = await apiFetch<ProfileResponse>("/users/profile").catch(() => null);
      const account = profile ? mapProfileUser(profile) : mapAuthUser(response);
      setUser(account);
      return account;
    } catch (err) {
      clearAuthTokens();
      setUser(null);
      if (err instanceof ApiError && err.status === 401) {
        return null;
      }
      throw err;
    }
  }

  async function completeGoogleLogin(code: string): Promise<AuthUser> {
    try {
      const response = await apiFetch<AuthResponse>("/auth/google/session", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      setAuthTokens(response.accessToken, response.refreshToken);
      const profile = await apiFetch<ProfileResponse>("/users/profile").catch(() => null);
      const account = profile ? mapProfileUser(profile) : mapAuthUser(response);
      setUser(account);
      return account;
    } catch (err) {
      clearAuthTokens();
      setUser(null);
      throw err;
    }
  }

  function logout() {
    void apiFetch("/auth/logout", { method: "POST" }).catch(() => undefined);
    setUser(null);
    setReturnTo(null);
    clearAuthTokens();
  }

  function updateUser(updates: Partial<AuthUser>) {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, returnTo, login, completeGoogleLogin, logout, setReturnTo, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
