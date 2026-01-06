import type { Config } from "tailwindcss";

const config: Config = {
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
        espresso: {
          50: "#faf8f6",
          100: "#f3efe9",
          200: "#e7dfd5",
          300: "#d4c4b0",
          400: "#b9a085",
          500: "#a08567",
          600: "#8a7057",
          700: "#725c48",
          800: "#5f4d3e",
          900: "#514336",
        },
        cream: "#fefcf9",
        sage: "#6b8e6b",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        "soft": "0 1px 2px rgba(81, 67, 54, 0.05)",
        "soft-md": "0 4px 6px -1px rgba(81, 67, 54, 0.08), 0 2px 4px -1px rgba(81, 67, 54, 0.04)",
        "soft-lg": "0 10px 15px -3px rgba(81, 67, 54, 0.1), 0 4px 6px -2px rgba(81, 67, 54, 0.05)",
        "soft-xl": "0 20px 25px -5px rgba(81, 67, 54, 0.1), 0 10px 10px -5px rgba(81, 67, 54, 0.04)",
        "inner-soft": "inset 0 2px 4px 0 rgba(81, 67, 54, 0.05)",
      },
      animation: {
        "fade-in": "fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in": "scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-in-right": "slide-in-right 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-soft": "pulse-soft 2s infinite",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "in-out-expo": "cubic-bezier(0.87, 0, 0.13, 1)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-warm": "linear-gradient(135deg, var(--color-espresso-100) 0%, var(--color-cream) 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
