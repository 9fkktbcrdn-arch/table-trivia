import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        parchment: "#F5E6C8",
        "tt-bg": "#0a0e17",
        "tt-surface": "#12182a",
        "tt-border": "#2a3f6b",
        "tt-cyan": "#22d3ee",
        "tt-magenta": "#e879f9",
        "tt-lime": "#a3e635",
        "tt-amber": "#fbbf24",
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
