"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { LangCode, Translations } from "@/lib/translations";
import { TRANSLATIONS, RTL_LANGS } from "@/lib/translations";

interface LanguageContextType {
  lang: LangCode;
  t: Translations;
  setLang: (lang: LangCode) => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  t: TRANSLATIONS.en,
  setLang: () => {},
  isRTL: false,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("en");

  useEffect(() => {
    const stored = localStorage.getItem("lang") as LangCode | null;
    if (stored && stored in TRANSLATIONS) setLangState(stored);
  }, []);

  function setLang(l: LangCode) {
    setLangState(l);
    localStorage.setItem("lang", l);
  }

  const isRTL = RTL_LANGS.includes(lang);

  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang, isRTL]);

  return (
    <LanguageContext.Provider value={{ lang, t: TRANSLATIONS[lang], setLang, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
