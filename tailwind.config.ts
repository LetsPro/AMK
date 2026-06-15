import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#F86A0D",
          secondary: "#333333",
          accent: "#FF9B4A",
          background: "#F8FAFC",
          success: "#10B981",
          danger: "#EF4444",
          warning: "#F59E0B"
        }
      },
      boxShadow: {
        glow: "0 20px 70px rgba(248, 106, 13, 0.18)"
      }
    }
  },
  plugins: []
} satisfies Config;
