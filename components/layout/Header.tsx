"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const signupRef = useRef<HTMLButtonElement>(null);
  const loginRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const navRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const mobileMenuRef = useRef<HTMLDivElement>(null);
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
      setMobileMenuOpen(false);
      return;
    }
    router.push(href as any);
    setMobileMenuOpen(false);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('button[aria-label="Toggle menu"]')
      ) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Prevent body scroll when menu is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-3 sm:px-6">
          {/* Mobile menu button */}
          <button
            aria-label="Toggle menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 active:bg-slate-100 dark:active:bg-slate-800 rounded-lg transition-colors relative z-50 flex-shrink-0 touch-manipulation"
            type="button"
          >
            {mobileMenuOpen ? <X size={24} className="pointer-events-none" /> : <Menu size={24} className="pointer-events-none" />}
          </button>

          {/* Desktop navigation */}
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

          {/* Logo - centered on mobile, absolute on desktop */}
          <div className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 z-10 max-w-[calc(100%-120px)] md:max-w-none">
            <AnimatedLogo />
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-1 h-full flex-shrink-0">
            <div className="flex items-center">
              <ThemeToggle />
            </div>
            <div className="hidden sm:flex items-center">
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

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile menu drawer */}
      <div
        ref={mobileMenuRef}
        className={`fixed top-16 left-0 right-0 z-50 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <nav className="flex flex-col px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => handleAppClick(item.href)}
              className={`w-full text-left px-4 py-3.5 min-h-[44px] rounded-lg text-base font-medium transition touch-manipulation active:opacity-80 ${
                pathname === item.href
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {item.label}
            </button>
          ))}
          {!isAuthenticated && (
            <>
              <div className="border-t border-slate-200 dark:border-slate-800 my-2" />
              <button
                onClick={() => {
                  openAuthModal("signup");
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3.5 min-h-[44px] rounded-lg text-base font-medium bg-slate-900 text-white dark:bg-white dark:text-slate-900 touch-manipulation active:opacity-80"
              >
                {t("signUp")}
              </button>
              <button
                onClick={() => {
                  openAuthModal("login");
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3.5 min-h-[44px] rounded-lg text-base font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 touch-manipulation active:opacity-80"
              >
                {t("logIn")}
              </button>
            </>
          )}
          <div className="border-t border-slate-200 dark:border-slate-800 my-2" />
          <div className="px-4 py-2">
            <LanguageSelector />
          </div>
        </nav>
      </div>
    </>
  );
};

export default Header;
