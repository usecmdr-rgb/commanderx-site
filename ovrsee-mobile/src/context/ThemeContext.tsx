import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ThemeMode = "light" | "dark";

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "@ovrsee_theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme from storage on mount
  useEffect(() => {
    loadTheme();
  }, []);

  // Save theme to storage when it changes
  useEffect(() => {
    if (isLoaded) {
      saveTheme(theme);
    }
  }, [theme, isLoaded]);

  const loadTheme = async () => {
    try {
      // Try to use localStorage for web, or AsyncStorage for native
      let storedTheme: string | null = null;
      
      if (typeof window !== "undefined" && window.localStorage) {
        // Web platform
        storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      } else {
        // Native platform - try AsyncStorage if available
        try {
          const AsyncStorage = require("@react-native-async-storage/async-storage").default;
          storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        } catch (e) {
          // AsyncStorage not available, use default
        }
      }
      
      if (storedTheme === "light" || storedTheme === "dark") {
        setThemeState(storedTheme);
      }
    } catch (error) {
      console.error("Error loading theme:", error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveTheme = async (newTheme: ThemeMode) => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        // Web platform
        window.localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      } else {
        // Native platform - try AsyncStorage if available
        try {
          const AsyncStorage = require("@react-native-async-storage/async-storage").default;
          await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
        } catch (e) {
          // AsyncStorage not available, skip saving
        }
      }
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === "dark",
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

