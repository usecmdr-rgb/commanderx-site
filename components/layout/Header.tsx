"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AnimatedLogo from "./AnimatedLogo";
import LanguageSelector from "./LanguageSelector";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";
import { useAppState } from "@/context/AppStateContext";
import { useTranslation } from "@/hooks/useTranslation";

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { openAuthModal, isAuthenticated } = useAppState();
  const t = useTranslation();
  const [hoveredButton, setHoveredButton] = useState<"signup" | "login" | null>(null);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const signupRef = useRef<HTMLButtonElement>(null);
  const loginRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const navRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });
  const [navSliderStyle, setNavSliderStyle] = useState({ left: 0, width: 0 });

  const navItems = [
    { label: t("navHome"), href: "/" },
    { label: t("navPricing"), href: "/pricing" },
    { label: t("navAbout"), href: "/about" },
    { label: t("navDashboard"), href: "/app" },
  ];

  const handleAppClick = (href: string) => {
    if (href.startsWith("/app") && !isAuthenticated) {
      openAuthModal("login");
      return;
    }
    router.push(href as any);
  };

  useEffect(() => {
    if (!containerRef.current) {
      setSliderStyle({ left: 0, width: 0 });
      return;
    }

    if (!hoveredButton) {
      setSliderStyle({ left: 0, width: 0 });
      return;
    }

    const buttonRef = hoveredButton === "signup" ? signupRef : loginRef;
    if (!buttonRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const buttonRect = buttonRef.current.getBoundingClientRect();

    setSliderStyle({
      left: buttonRect.left - containerRect.left,
      width: buttonRect.width,
    });
  }, [hoveredButton]);

  useEffect(() => {
    if (!navContainerRef.current) {
      setNavSliderStyle({ left: 0, width: 0 });
      return;
    }

    if (!hoveredNav) {
      setNavSliderStyle({ left: 0, width: 0 });
      return;
    }

    const buttonRef = navRefs.current[hoveredNav];
    if (!buttonRef) return;

    const containerRect = navContainerRef.current.getBoundingClientRect();
    const buttonRect = buttonRef.getBoundingClientRect();

    setNavSliderStyle({
      left: buttonRect.left - containerRect.left,
      width: buttonRect.width,
    });
  }, [hoveredNav]);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <nav
          ref={navContainerRef}
          className="hidden md:flex relative items-center space-x-[10px] text-sm font-medium"
          onMouseLeave={() => setHoveredNav(null)}
        >
          {/* Hover bubble for nav */}
          {hoveredNav && (
            <div
              className="absolute top-0 bottom-0 rounded-full bg-slate-900 dark:bg-white"
              style={{
                left: `${navSliderStyle.left}px`,
                width: `${navSliderStyle.width}px`,
              }}
            />
          )}
          {navItems.map((item) => (
            <button
              key={item.href}
              ref={(el) => {
                navRefs.current[item.href] = el;
              }}
              onClick={() => handleAppClick(item.href)}
              onMouseEnter={() => setHoveredNav(item.href)}
              className={`relative z-10 rounded-full px-4 py-2 transition ${
                hoveredNav === item.href
                  ? "text-white dark:text-slate-900"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="absolute left-1/2 -translate-x-1/2">
          <AnimatedLogo />
        </div>
        <div className="flex items-center space-x-1 h-full">
          <div className="flex items-center">
            <ThemeToggle />
          </div>
          <div className="flex items-center">
            <LanguageSelector />
          </div>
          {!isAuthenticated && (
            <div
              ref={containerRef}
              className="hidden sm:flex relative items-center space-x-1.5 text-sm font-medium"
              onMouseLeave={() => setHoveredButton(null)}
            >
              {/* Sliding bubble */}
              <div
                className="absolute top-0 bottom-0 rounded-full bg-slate-900 dark:bg-white transition-all duration-200 ease-out"
                style={{
                  left: `${sliderStyle.left}px`,
                  width: `${sliderStyle.width}px`,
                }}
              />
              <button
                ref={signupRef}
                onClick={() => openAuthModal("signup")}
                onMouseEnter={() => setHoveredButton("signup")}
                className={`relative z-10 rounded-full px-4 py-2 transition ${
                  hoveredButton === "signup"
                    ? "text-white dark:text-slate-900"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                {t("signUp")}
              </button>
              <button
                ref={loginRef}
                onClick={() => openAuthModal("login")}
                onMouseEnter={() => setHoveredButton("login")}
                className={`relative z-10 rounded-full px-4 py-2 transition ${
                  hoveredButton === "login"
                    ? "text-white dark:text-slate-900"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                {t("logIn")}
              </button>
            </div>
          )}
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
