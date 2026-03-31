import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("sahayak_lang") || "en";
  });

  const toggleLang = () => {
    setLang((prev) => {
      const next = prev === "en" ? "hi" : "en";
      localStorage.setItem("sahayak_lang", next);
      return next;
    });
  };

  // Update <html lang> attribute for accessibility
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => useContext(LanguageContext);
