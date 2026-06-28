import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { arMessages } from "../i18n/ar";
import { enMessages } from "../i18n/en";

export type AppLocale = "ar" | "en";

export type MessageCatalog = typeof arMessages;

type I18nContextValue = {
  locale: AppLocale;
  messages: MessageCatalog;
  setLocale: (locale: AppLocale) => void;
  toggleLocale: () => void;
};

const STORAGE_KEY = "nima_frontend_locale";
const I18nContext = createContext<I18nContextValue | null>(null);

function getInitialLocale(): AppLocale {
  if (typeof window === "undefined") {
    return "ar";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "en" ? "en" : "ar";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(getInitialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    const setLocale = (nextLocale: AppLocale) => {
      setLocaleState(nextLocale);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, nextLocale);
      }
    };

    return {
      locale,
      messages: (locale === "ar" ? arMessages : enMessages) as MessageCatalog,
      setLocale,
      toggleLocale: () => setLocale(locale === "ar" ? "en" : "ar")
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return context;
}
