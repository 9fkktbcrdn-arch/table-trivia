import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        parchment: "#F5E6C8",
        "tt-bg": "#060a1f",
        "tt-surface": "#0e1f5a",
        "tt-border": "#3f67d8",
        "tt-cyan": "#67d5ff",
        "tt-magenta": "#b18cff",
        "tt-lime": "#8bf58d",
        "tt-amber": "#ffd24d",
        "tt-rose": "#fb7185",
      },
      fontFamily: {
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        stat: ["var(--font-stat)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
