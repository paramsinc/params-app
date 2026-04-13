import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
        heading: ["var(--font-heading)", "Nunito", "sans-serif"],
      },
      colors: {
        brand: "var(--color-brand)",
        surface1: "var(--color-surface1)",
        surface2: "var(--color-surface2)",
        surface3: "var(--color-surface3)",
      },
    },
  },
  plugins: [],
}

export default config
