import { createContext, useContext, useState, useEffect } from "react";
import translations from "../i18n/translations";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem("vel_finance_lang");
      return saved === "en" ? "en" : "ta"; // Default to Tamil
    } catch {
      return "ta";
    }
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("vel_finance_lang", lang);
    } catch (e) {
      console.warn("Could not save language to localStorage", e);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "ta" ? "en" : "ta");
  };

  // Helper function to resolve dotted keys e.g. "dashboard.available_cash"
  const t = (path, fallback = "") => {
    if (!path) return fallback;
    const parts = path.split(".");
    let current = translations[language];

    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part];
      } else {
        // Fallback to English if missing in Tamil, or return fallback
        let enCurrent = translations.en;
        for (const p of parts) {
          if (enCurrent && typeof enCurrent === "object" && p in enCurrent) {
            enCurrent = enCurrent[p];
          } else {
            return fallback || path;
          }
        }
        return enCurrent || fallback || path;
      }
    }

    return typeof current === "string" ? current : (fallback || path);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        isTamil: language === "ta",
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
