/**
 * OVRSEE MOBILE – DESIGN SYSTEM FOUNDATIONS
 * 
 * Mirrors OVRSEE WEB design system for consistent brand experience
 * Applied globally across all screens, components, and agents
 */

// Dark mode colors
const darkColors = {
  backgrounds: {
    background0: "#000000", // Main app background (dark mode: bg-black)
    background1: "#0F172A", // Slate-900 base color
    background2: "rgba(15, 23, 42, 0.4)", // Cards / modules / bubbles (slate-900/40) - matches web dark:bg-slate-900/40
    background3: "#1E293B", // Slate-800 (border color) - matches web dark:border-slate-800
  },
  text: {
    textPrimary: "#F1F5F9", // Slate-100 (dark:text-slate-100)
    textSecondary: "#94A3B8", // Slate-400 (dark:text-slate-400)
    textMuted: "#64748B", // Slate-500 (text-slate-500)
  },
};

// Light mode colors
const lightColors = {
  backgrounds: {
    background0: "#FFFFFF", // Main app background (light mode: bg-white)
    background1: "#F8FAFC", // Slate-50 base color
    background2: "rgba(248, 250, 252, 0.8)", // Cards / modules / bubbles (light background)
    background3: "#E2E8F0", // Slate-200 (border color) - matches web border-slate-200
  },
  text: {
    textPrimary: "#0F172A", // Slate-900 (light mode: text-slate-900)
    textSecondary: "#475569", // Slate-600 (light mode: text-slate-600)
    textMuted: "#94A3B8", // Slate-400 (text-slate-400)
  },
};

export const designSystem = {
  // ============================================================
  // BACKGROUND SYSTEM (Matches Web App)
  // ============================================================
  backgrounds: darkColors.backgrounds, // Default to dark (will be overridden by theme)

  // ============================================================
  // TEXT COLORS (Matches Web Slate Colors)
  // ============================================================
  text: darkColors.text, // Default to dark (will be overridden by theme)

  // ============================================================
  // BRAND COLORS (Matches Web Brand Colors)
  // ============================================================
  brand: {
    primaryBlue: "#4F46E5", // Brand accent (indigo-600) - matches web brand.accent
    primaryMuted: "#6366F1", // Indigo-500
    glowBlue: "#818CF8", // Indigo-400
  },

  // ============================================================
  // STATUS COLORS
  // ============================================================
  status: {
    success: "#18C78A",
    warning: "#FFB04D",
    error: "#FF6B6B",
  },

  // ============================================================
  // ICON COLORS (Matches Web Icon Colors)
  // ============================================================
  icons: {
    active: "#4F46E5", // Brand accent - matches web primary brand blue
    inactive: "rgba(148, 163, 184, 0.6)", // Slate-400 muted - matches web inactive icon color
  },

  // ============================================================
  // SHADOW (Matches Web shadow-sm)
  // ============================================================
  shadow: {
    shadowColor: "#000000",
    shadowOpacity: 0.05, // Subtle shadow like web shadow-sm
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    // Android elevation (subtle)
    elevation: 2,
  },

  // ============================================================
  // SPACING + ROUNDING
  // ============================================================
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    "2xl": 48,
  },

  borderRadius: {
    card: 24, // rounded-3xl (24px) - matches web
    bubble: 24, // Same as card
  },

  padding: {
    card: 16, // p-4 (16px) on mobile, matches web p-4 sm:p-6
    cardLarge: 24, // p-6 (24px) for larger screens
    sectionGap: 16,
    headerTop: 24,
    headerHorizontal: 16,
  },

  // ============================================================
  // BOTTOM TAB BAR (Matches Web Nav Bar)
  // ============================================================
  tabBar: {
    height: 68, // Bottom tab height: 64–72 (using 68 as middle)
    backgroundColor: "#000000", // Matches web bg-black (dark mode)
    backgroundColorLight: "#FFFFFF", // Light mode background
    activeColor: "#4F46E5", // Brand accent - matches web primary brand blue
    inactiveColor: "rgba(148, 163, 184, 0.6)", // Slate-400 muted - matches web inactive icon color
    inactiveColorLight: "rgba(71, 85, 105, 0.6)", // Slate-600 muted for light mode
  },

  // ============================================================
  // RESPONSIVE BREAKPOINTS (for future use)
  // ============================================================
  breakpoints: {
    small: 375, // iPhone SE
    medium: 414, // iPhone 15 Pro Max
  },
} as const;

// Export shadow styles as React Native StyleSheet-compatible object
export const shadowStyle = {
  shadowColor: designSystem.shadow.shadowColor,
  shadowOpacity: designSystem.shadow.shadowOpacity,
  shadowRadius: designSystem.shadow.shadowRadius,
  shadowOffset: designSystem.shadow.shadowOffset,
  elevation: designSystem.shadow.elevation,
};

// Export theme color getters
export function getThemeColors(theme: "light" | "dark") {
  return theme === "light" ? lightColors : darkColors;
}

// Type exports
export type DesignSystem = typeof designSystem;

