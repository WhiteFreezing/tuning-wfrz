import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0a0e0c", surface: "#13191b", muted: "#1c2329", border: "#2b343a",
        text: "#e8eaef", dim: "#8b9099",
        brand: { DEFAULT: "#06b6d4", soft: "#67e8f9", deep: "#0e7490" },
        accent: "#f59e0b",
      },
      fontFamily: { sans: ["Inter","system-ui"], mono: ["JetBrains Mono","ui-monospace"] },
    },
  },
  plugins: [typography],
} satisfies Config;
