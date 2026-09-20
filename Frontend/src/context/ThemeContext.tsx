import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const DEFAULT_THEME: Theme = "light";
const LEGACY_THEME_KEY = "petopia_theme";

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const storageKey = `petopia_theme:${user?.id ?? "guest"}`;
  const [theme, setThemeState] = useState<Theme>(() => DEFAULT_THEME);

  const isDark = theme === "dark";

  function applyTheme(t: Theme) {
    const root = document.documentElement;
    if (t === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }

  function setTheme(t: Theme) {
    setThemeState(t);
    sessionStorage.setItem(storageKey, t);
    applyTheme(t);
  }

  function toggleTheme() {
    setTheme(isDark ? "light" : "dark");
  }

  useEffect(() => {
    localStorage.removeItem(LEGACY_THEME_KEY);
    const stored = sessionStorage.getItem(storageKey);
    setThemeState(isTheme(stored) ? stored : DEFAULT_THEME);
  }, [storageKey]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
