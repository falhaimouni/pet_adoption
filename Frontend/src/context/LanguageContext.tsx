import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import translations, { Lang } from "../i18n/translations";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem("petopia_lang") as Lang | null;
    return stored && stored in translations ? stored : "en";
  });

  const isRtl = lang === "ar";

  function setLang(newLang: Lang) {
    setLangState(newLang);
    localStorage.setItem("petopia_lang", newLang);
  }

  function t(key: string): string {
    return translations[lang][key] ?? translations["en"][key] ?? key;
  }

  useEffect(() => {
    document.documentElement.setAttribute("dir", isRtl ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
    document.body.setAttribute("dir", isRtl ? "rtl" : "ltr");
    document.body.classList.toggle("rtl", isRtl);
  }, [lang, isRtl]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
