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
const THEME_STORAGE_PREFIX = "petopia_theme:";

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const storageKey = user ? `${THEME_STORAGE_PREFIX}${user.id}` : null;
  const [theme, setThemeState] = useState<Theme>(() => DEFAULT_THEME);

  const isDark = theme === "dark";

  function applyTheme(t: Theme) {
    const root = document.documentElement;
    if (t === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }

  function setTheme(t: Theme) {
    setThemeState(t);
    if (storageKey) localStorage.setItem(storageKey, t);
    applyTheme(t);
  }

  function toggleTheme() {
    setTheme(isDark ? "light" : "dark");
  }

  useEffect(() => {
    const stored = storageKey ? localStorage.getItem(storageKey) : null;
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
