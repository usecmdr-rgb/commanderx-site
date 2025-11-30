import { designSystem, getThemeColors } from "./designSystem";

// Helper function to get theme-aware colors
export function getColors(theme: "light" | "dark" = "dark") {
  const themeColors = getThemeColors(theme);
  const isDark = theme === "dark";
  
  return {
    // Background system (Matches Web App)
    background: {
      background0: themeColors.backgrounds.background0,
      background1: themeColors.backgrounds.background1,
      background2: themeColors.backgrounds.background2,
      background3: themeColors.backgrounds.background3,
      // Legacy aliases for backward compatibility
      dark: isDark ? themeColors.backgrounds.background0 : themeColors.backgrounds.background0,
      card: themeColors.backgrounds.background2,
      surface: themeColors.backgrounds.background1,
    },
    
    // Text colors (Matches Web Slate Colors)
    text: {
      // Standard properties
      primary: themeColors.text.textPrimary,
      secondary: themeColors.text.textSecondary,
      tertiary: themeColors.text.textMuted,
      muted: themeColors.text.textMuted,
      // Aliases for clarity (matches designSystem naming)
      textPrimary: themeColors.text.textPrimary,
      textSecondary: themeColors.text.textSecondary,
      textMuted: themeColors.text.textMuted,
    },
    
    // Brand colors (same for both themes)
    brand: {
      primary: designSystem.brand.primaryBlue,
      primaryBlue: designSystem.brand.primaryBlue,
      primaryMuted: designSystem.brand.primaryMuted,
      glowBlue: designSystem.brand.glowBlue,
      // Legacy alias
      accent: designSystem.brand.primaryBlue,
      subtle: designSystem.brand.primaryMuted,
    },
    
    // Status colors (same for both themes)
    status: {
      success: designSystem.status.success,
      warning: designSystem.status.warning,
      error: designSystem.status.error,
      info: designSystem.brand.primaryBlue,
    },
    
    // Icon colors (same for both themes)
    icons: {
      active: designSystem.icons.active,
      inactive: designSystem.icons.inactive,
    },
    
    // Border colors
    border: {
      default: themeColors.backgrounds.background3,
      light: "#E2E8F0", // Slate-200
    },
    
    // Agent colors (same for both themes)
    agent: {
      sync: designSystem.brand.primaryBlue,
      aloha: designSystem.brand.primaryBlue,
      studio: designSystem.brand.primaryBlue,
      insight: designSystem.brand.primaryBlue,
    },
  };
}

// Default export for backward compatibility (dark theme)
export const colors = getColors("dark");

// Export type
export type ColorTheme = ReturnType<typeof getColors>;
