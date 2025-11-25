import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./context/**/*.{ts,tsx}",
  ],
  darkMode: ["class"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      colors: {
        brand: {
          primary: "#0F172A",
          accent: "#4F46E5",
          subtle: "#CBD5F5",
        },
        agent: {
          alpha: "#0EA5E9",
          xi: "#F97316",
          mu: "#8B5CF6",
          beta: "#10B981",
        },
      },
    },
  },
  plugins: [],
};

export default config;
