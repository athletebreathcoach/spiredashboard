import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        accent: "var(--accent)",
        dark: {
          DEFAULT: "#1C1C1E",
          50: "#2C2C2E",
          100: "#3A3A3C",
          200: "#48484A",
          300: "#636366",
          400: "#8E8E93",
          500: "#AEAEB2",
          600: "#C7C7CC",
          700: "#D1D1D6",
          800: "#E5E5EA",
          900: "#F2F2F7",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
