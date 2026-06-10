import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { en } from "./translations/en";
import { ar } from "./translations/ar";
import { zh } from "./translations/zh";

export type Language = "en" | "ar" | "zh";
type Translations = typeof en;

const translations: Record<Language, Translations> = { en, ar: ar as unknown as Translations, zh: zh as unknown as Translations };

const languageLabels: Record<Language, string> = { en: "English", ar: "العربية", zh: "中文" };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  dir: "ltr" | "rtl";
  languageLabels: Record<Language, string>;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("prestige-lang");
    return (saved as Language) || "en";
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("prestige-lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, []);

  const dir = language === "ar" ? "rtl" : "ltr";
  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir, languageLabels }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
