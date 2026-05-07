import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      mobile:  { max: "767px" },
      tablet:  { min: "768px", max: "1024px" },
      desktop: { min: "1025px" },
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
    },
    extend: {
      colors: {
        // Surfaces
        "surface-page":    "var(--surface-page)",
        "surface-card":    "var(--surface-card)",
        "surface-inner":   "var(--surface-inner)",
        "surface-inverse": "var(--surface-inverse)",
        // Olive
        "olive-50":  "var(--olive-50)",
        "olive-100": "var(--olive-100)",
        "olive-200": "var(--olive-200)",
        "olive-300": "var(--olive-300)",
        "olive-400": "var(--olive-400)",
        "olive-500": "var(--olive-500)",
        "olive-600": "var(--olive-600)",
        "olive-700": "var(--olive-700)",
        "olive-800": "var(--olive-800)",
        "olive-900": "var(--olive-900)",
        // Gold
        "gold-200": "var(--gold-200)",
        "gold-400": "var(--gold-400)",
        "gold-500": "var(--gold-500)",
        "gold-600": "var(--gold-600)",
        // Text
        "text-primary":   "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-tertiary":  "var(--text-tertiary)",
        // Borders (used as bg for stroke utilities only when needed)
        "border-default": "var(--border-default)",
        "border-hover":   "var(--border-hover)",
        // TTG band tokens
        "band-track":         "var(--band-track)",
        "band-support":       "var(--band-support)",
        "band-urgent":        "var(--band-urgent)",
        "band-pivot":         "var(--band-pivot)",
        "band-track-fill":    "var(--band-track-fill)",
        "band-track-border":  "var(--band-track-border)",
        "band-support-fill":  "var(--band-support-fill)",
        "band-support-border":"var(--band-support-border)",
        "band-urgent-fill":   "var(--band-urgent-fill)",
        "band-urgent-border": "var(--band-urgent-border)",
        "band-pivot-fill":    "var(--band-pivot-fill)",
        "band-pivot-border":  "var(--band-pivot-border)",
        // Legacy aliases
        "band-green":         "var(--band-green)",
        "band-yellow":        "var(--band-yellow)",
        "band-red":           "var(--band-red)",
        "band-locked":        "var(--band-locked)",
        "band-green-fill":    "var(--band-green-fill)",
        "band-green-border":  "var(--band-green-border)",
        "band-yellow-fill":   "var(--band-yellow-fill)",
        "band-yellow-border": "var(--band-yellow-border)",
        "band-red-fill":      "var(--band-red-fill)",
        "band-red-border":    "var(--band-red-border)",
        "band-locked-fill":   "var(--band-locked-fill)",
        "band-locked-border": "var(--band-locked-border)",
        "escalation":         "var(--color-escalation)",
        "escalation-fill":    "var(--color-escalation-fill)",
      },
      fontFamily: {
        serif: ["var(--font-dm-serif)", "Georgia", "serif"],
        mono:  ["var(--font-mono)", "ui-monospace", "monospace"],
        sans:  ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-default)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
    },
  },
  plugins: [],
};
export default config;
