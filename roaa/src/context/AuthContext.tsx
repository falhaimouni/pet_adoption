import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserRole = "adopter" | "staff" | "vet" | "manager" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  username: string;
  role: UserRole;
  avatar?: string;
  joinDate: string;
  lastLogin: string;
  phone?: string;
  city?: string;
  bio?: string;
  gender?: string;
  dob?: string;
  address?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  returnTo: string | null;
  login: (email: string, password: string) => Promise<AuthUser | null>;
  logout: () => void;
  setReturnTo: (page: string | null) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "petopia_auth_user";

// In a real app the backend/database decides the role. Here we simulate that
// lookup: emails containing "admin" (or the seeded accounts below) resolve to
// their role, everything else defaults to a regular adopter user.
const SEEDED_ACCOUNTS: Record<string, AuthUser> = {
  "admin@petopia.com": {
    id: "u-admin", email: "admin@petopia.com", name: "Jordan Park", username: "jp_admin",
    role: "admin", joinDate: "2019-01-05", lastLogin: "", phone: "+1 (555) 678-9012",
    city: "Seattle", gender: "Prefer not to say", bio: "System administrator for Petopia.",
  },
  "manager@petopia.com": {
    id: "u-manager", email: "manager@petopia.com", name: "Marcus Williams", username: "marcus_w",
    role: "manager", joinDate: "2020-11-22", lastLogin: "", phone: "+1 (555) 567-8901",
    city: "Chicago", gender: "Male", bio: "Operations manager overseeing the shelter network.",
  },
  "staff@petopia.com": {
    id: "u-staff", email: "staff@petopia.com", name: "Alex Rivera", username: "alex_r",
    role: "staff", joinDate: "2022-09-01", lastLogin: "", phone: "+1 (555) 345-6789",
    city: "Austin", gender: "Male", bio: "Shelter staff member passionate about animal welfare.",
  },
  "vet@petopia.com": {
    id: "u-vet", email: "vet@petopia.com", name: "Dr. Emily Chen", username: "dr_emily",
    role: "vet", joinDate: "2021-03-10", lastLogin: "", phone: "+1 (555) 456-7890",
    city: "New York", gender: "Female", bio: "Veterinarian with 8+ years of experience.",
  },
};

function resolveAccount(email: string): AuthUser {
  const key = email.toLowerCase().trim();
  if (SEEDED_ACCOUNTS[key]) {
    return { ...SEEDED_ACCOUNTS[key], lastLogin: new Date().toISOString() };
  }
  // Heuristic role detection for any other email (simulating a DB lookup).
  let role: UserRole = "adopter";
  if (key.includes("admin")) role = "admin";
  else if (key.includes("manager")) role = "manager";
  else if (key.includes("staff")) role = "staff";
  else if (key.includes("vet")) role = "vet";

  const namePart = key.split("@")[0].replace(/[._-]/g, " ");
  const name = namePart.replace(/\b\w/g, (c) => c.toUpperCase()) || "New User";
  return {
    id: `u-${Date.now()}`,
    email,
    name,
    username: key.split("@")[0],
    role,
    joinDate: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as AuthUser) : null;
    } catch {
      return null;
    }
  });
  const [returnTo, setReturnTo] = useState<string | null>(null);

  const isAuthenticated = user !== null;

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  async function login(email: string, _password: string): Promise<AuthUser | null> {
    const account = resolveAccount(email);
    setUser(account);
    return account;
  }

  function logout() {
    setUser(null);
    setReturnTo(null);
  }

  function updateUser(updates: Partial<AuthUser>) {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, returnTo, login, logout, setReturnTo, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
