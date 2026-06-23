import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      colors: {
        primary: "#111827",
        "primary-soft": "#1F2937",
        terracotta: "#c05d34",
        "terracotta-dark": "#974528",
        lime: "#D8FF3E",
        sand: "#E5E0D8",
        canvas: "#F8F7F3",
        cream: "#FFFDF9",
        ink: "#111827",
        muted: "#6B7280",
      },

      boxShadow: {
        soft: "0 24px 70px rgba(17, 24, 39, 0.09)",
      },
    },
  },

  plugins: [],
} satisfies Config;
