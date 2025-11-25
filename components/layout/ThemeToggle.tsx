"use client";

import { Moon, Sun } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";

const ThemeToggle = () => {
  const { theme, toggleTheme, isMounted } = useAppState();

  if (!isMounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className="inline-flex items-center justify-center rounded-full w-8 h-8 text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
      aria-label="Toggle theme"
    >
      {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
};

export default ThemeToggle;
