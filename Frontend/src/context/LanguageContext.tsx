import { DirectionProvider } from "@radix-ui/react-direction";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import translations, { Lang } from "../i18n/translations";
import { useAuth } from "./AuthContext";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const DEFAULT_LANG: Lang = "en";
const LEGACY_LANG_KEY = "petopia_lang";

function isLang(value: string | null): value is Lang {
  return value === "en" || value === "ar" || value === "fr";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const storageKey = `petopia_lang:${user?.id ?? "guest"}`;
  const [lang, setLangState] = useState<Lang>(() => DEFAULT_LANG);

  const isRtl = lang === "ar";

  function setLang(newLang: Lang) {
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    setLangState(newLang);
    sessionStorage.setItem(storageKey, newLang);
  }

  const t = useCallback((key: string): string => {
    return translations[lang][key] ?? translations["en"][key] ?? key;
  }, [lang]);

  useEffect(() => {
    localStorage.removeItem(LEGACY_LANG_KEY);
    const stored = sessionStorage.getItem(storageKey);
    const next = isLang(stored) ? stored : DEFAULT_LANG;
    document.documentElement.lang = next;
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
    setLangState(next);
  }, [storageKey]);

  useEffect(() => {
    document.documentElement.setAttribute("dir", isRtl ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
    document.body.setAttribute("dir", isRtl ? "rtl" : "ltr");
    document.body.classList.toggle("rtl", isRtl);
  }, [lang, isRtl]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRtl }}>
      <DirectionProvider dir={isRtl ? "rtl" : "ltr"}>{children}</DirectionProvider>
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
