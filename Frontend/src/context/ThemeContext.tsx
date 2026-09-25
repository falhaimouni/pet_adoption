import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
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
const GUEST_THEME_STORAGE_KEY = "petopia_theme:guest";
const THEME_STORAGE_PREFIX = "petopia_theme:";

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark";
}

function readStoredTheme(storageKey: string | null): Theme {
  if (storageKey) {
    const userTheme = localStorage.getItem(storageKey);
    if (isTheme(userTheme)) return userTheme;
    return DEFAULT_THEME;
  }

  const guestTheme = sessionStorage.getItem(GUEST_THEME_STORAGE_KEY);
  if (isTheme(guestTheme)) return guestTheme;
  return DEFAULT_THEME;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const storageKey = user ? `${THEME_STORAGE_PREFIX}${user.id}` : null;
  const previousStorageKeyRef = useRef(storageKey);
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme(storageKey));

  const isDark = theme === "dark";

  function applyTheme(t: Theme) {
    const root = document.documentElement;
    if (t === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }

  function setTheme(t: Theme) {
    setThemeState(t);
    if (storageKey) {
      localStorage.setItem(storageKey, t);
    } else {
      sessionStorage.setItem(GUEST_THEME_STORAGE_KEY, t);
    }
    applyTheme(t);
  }

  function toggleTheme() {
    setTheme(isDark ? "light" : "dark");
  }

  useEffect(() => {
    const previousStorageKey = previousStorageKeyRef.current;

    if (!previousStorageKey && storageKey) {
      const guestTheme = sessionStorage.getItem(GUEST_THEME_STORAGE_KEY);
      if (isTheme(guestTheme)) {
        setThemeState(guestTheme);
        localStorage.setItem(storageKey, guestTheme);
        sessionStorage.removeItem(GUEST_THEME_STORAGE_KEY);
      } else {
        const storedTheme = readStoredTheme(storageKey);
        setThemeState(storedTheme);
      }
      previousStorageKeyRef.current = storageKey;
      return;
    }

    if (previousStorageKey && !storageKey) {
      sessionStorage.removeItem(GUEST_THEME_STORAGE_KEY);
      setThemeState(DEFAULT_THEME);
      previousStorageKeyRef.current = storageKey;
      return;
    }

    const storedTheme = readStoredTheme(storageKey);
    setThemeState(storedTheme);
    if (storageKey) localStorage.setItem(storageKey, storedTheme);
    previousStorageKeyRef.current = storageKey;
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
