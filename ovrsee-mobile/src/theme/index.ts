export * from "./colors";
export * from "./typography";
export * from "./designSystem";
import { colors, getColors } from "./colors";
import { typography } from "./typography";
import { designSystem, shadowStyle } from "./designSystem";

// Export theme getter function
export function getTheme(theme: "light" | "dark" = "dark") {
  const themeColors = getColors(theme);
  
  return {
    colors: themeColors,
    typography,
    spacing: designSystem.spacing,
    padding: designSystem.padding,
    borderRadius: {
      sm: 8,
      md: 12,
      lg: designSystem.borderRadius.card,
      xl: 24,
      full: 9999,
      card: designSystem.borderRadius.card,
      bubble: designSystem.borderRadius.bubble,
    },
    shadows: {
      sm: {
        // Matches web shadow-sm (subtle shadow)
        shadowColor: designSystem.shadow.shadowColor,
        shadowOffset: designSystem.shadow.shadowOffset,
        shadowOpacity: designSystem.shadow.shadowOpacity,
        shadowRadius: designSystem.shadow.shadowRadius,
        elevation: designSystem.shadow.elevation,
      },
      md: {
        shadowColor: designSystem.shadow.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: designSystem.shadow.shadowOpacity * 1.5,
        shadowRadius: 6,
        elevation: 4,
      },
      lg: shadowStyle,
      glow: shadowStyle,
    },
    designSystem,
  };
}

// Default theme export (dark mode for backward compatibility)
export const theme = {
  colors,
  typography,
  spacing: designSystem.spacing,
  padding: designSystem.padding,
  borderRadius: {
    sm: 8,
    md: 12,
    lg: designSystem.borderRadius.card,
    xl: 24,
    full: 9999,
    card: designSystem.borderRadius.card,
    bubble: designSystem.borderRadius.bubble,
  },
  shadows: {
    sm: {
      // Matches web shadow-sm (subtle shadow)
      shadowColor: designSystem.shadow.shadowColor,
      shadowOffset: designSystem.shadow.shadowOffset,
      shadowOpacity: designSystem.shadow.shadowOpacity,
      shadowRadius: designSystem.shadow.shadowRadius,
      elevation: designSystem.shadow.elevation,
    },
    md: {
      shadowColor: designSystem.shadow.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: designSystem.shadow.shadowOpacity * 1.5,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: shadowStyle,
    glow: shadowStyle,
  },
  designSystem,
};

export type Theme = typeof theme;
