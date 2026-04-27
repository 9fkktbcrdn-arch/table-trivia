import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        parchment: "#FFF8E7",
        "tt-bg": "#1A1915",
        "tt-surface": "#2C2B26",
        "tt-surface-mid": "#3A3833",
        "tt-border": "rgba(212,160,23,0.2)",
        "tt-gold": "#D4A017",
        "tt-gold-bright": "#F5C842",
        "tt-subtle": "#9C9890",
        "tt-faint": "#6B6760",
        "tt-success": "#2DB87A",
        "tt-error": "#E84040",
        "tt-warning": "#F5A623",
        // Backward-compatible aliases
        "tt-cyan": "#D4A017",
        "tt-magenta": "#F5C842",
        "tt-lime": "#2DB87A",
        "tt-amber": "#F5A623",
        "tt-rose": "#E84040",
      },
      fontFamily: {
        body: ["Inter", "system-ui", "sans-serif"],
        stat: ["Syne", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
