"use client";

import { useState, useRef, useEffect } from "react";
import { Settings, Moon, Sun, Globe, Shield, FileText, X } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useRouter } from "next/navigation";
import type { LanguageCode } from "@/context/AppStateContext";

type Language = {
  code: string;
  name: string;
  flag: string;
};

const languages: Language[] = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "nl", name: "Nederlands", flag: "🇳🇱" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
];

interface SettingsMenuProps {
  isAuthenticated: boolean;
}

const SettingsMenu = ({ isAuthenticated }: SettingsMenuProps) => {
  const { theme, toggleTheme, language, setLanguage, isMounted } = useAppState();
  const t = useTranslation();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find((lang) => lang.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowLanguageMenu(false);
      }
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setShowLanguageMenu(false);
      }
    };

    if (isOpen || showLanguageMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, showLanguageMenu]);

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode as LanguageCode);
    setShowLanguageMenu(false);
  };

  const handlePrivacyClick = () => {
    router.push("/privacy");
    setIsOpen(false);
  };

  const handleTermsClick = () => {
    router.push("/terms");
    setIsOpen(false);
  };

  if (!isMounted) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center rounded-full w-8 h-8 text-slate-600 transition hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:text-slate-300 dark:hover:text-slate-100 dark:focus-visible:outline-white"
        aria-label="Settings"
        aria-expanded={isOpen}
      >
        <Settings size={16} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-10 z-50 w-56 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="py-1">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:focus-visible:outline-white"
            >
              {theme === "light" ? (
                <Moon size={16} className="text-slate-600 dark:text-slate-300" aria-hidden="true" />
              ) : (
                <Sun size={16} className="text-slate-600 dark:text-slate-300" aria-hidden="true" />
              )}
              <span className="flex-1 text-slate-700 dark:text-slate-300">
                {theme === "light" ? "Dark Mode" : "Light Mode"}
              </span>
            </button>

            {/* Language Selector */}
            <div className="relative" ref={languageMenuRef}>
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:focus-visible:outline-white"
              >
                <Globe size={16} className="text-slate-600 dark:text-slate-300" aria-hidden="true" />
                <span className="flex-1 text-slate-700 dark:text-slate-300">Language</span>
                <span className="text-xs text-slate-500" aria-hidden="true">{currentLanguage.flag}</span>
              </button>

              {showLanguageMenu && (
                <div className="absolute left-full top-0 ml-1 w-48 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 z-50">
                  <div className="py-1">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:focus-visible:outline-white ${
                          language === lang.code
                            ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                            : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span className="text-sm" aria-hidden="true">{lang.flag}</span>
                        <span className="flex-1">{lang.name}</span>
                        {language === lang.code && (
                          <span className="text-xs text-slate-500" aria-hidden="true">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Privacy and Terms - only show when not authenticated */}
            {!isAuthenticated && (
              <>
                <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
                <button
                  onClick={handlePrivacyClick}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:focus-visible:outline-white"
                >
                  <Shield size={16} className="text-slate-600 dark:text-slate-300" aria-hidden="true" />
                  <span className="flex-1 text-slate-700 dark:text-slate-300">{t("userMenuPrivacy") || "Privacy Policy"}</span>
                </button>
                <button
                  onClick={handleTermsClick}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:focus-visible:outline-white"
                >
                  <FileText size={16} className="text-slate-600 dark:text-slate-300" aria-hidden="true" />
                  <span className="flex-1 text-slate-700 dark:text-slate-300">{t("userMenuTerms") || "Terms of Service"}</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsMenu;

