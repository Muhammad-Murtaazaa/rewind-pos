import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FCF9F5",
          100: "#F7F1E8",
          200: "#EFE5D6",
          300: "#E3D5C0",
          400: "#D3BEA1",
        },
        espresso: {
          700: "#3D2B22",
          800: "#2B1E18",
          900: "#1E1714",
          950: "#150F0D",
        },
        vintage: {
          orange: "#E07A3F",
          "orange-hover": "#D06B30",
          "orange-light": "#FDEEE6",
        },
        sage: {
          DEFAULT: "#7C9A7E",
          light: "#EAF1EA",
          dark: "#5E7B60",
        },
        mustard: {
          DEFAULT: "#D9A441",
          light: "#FAF3E4",
          dark: "#B88628",
        },
        brick: {
          DEFAULT: "#C2453B",
          light: "#F9E9E8",
          dark: "#A33229",
        },
        surface: {
          light: "#FFFFFF",
          warm: "#FAF6F0",
          dark: "#2A211D",
        },
      },
      fontFamily: {
        serif: ["Fraunces", "serif"],
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        café: "16px",
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(43, 30, 24, 0.08)",
        card: "0 2px 10px rgba(43, 30, 24, 0.05)",
        floating: "0 8px 30px rgba(43, 30, 24, 0.12)",
      },
      animation: {
        "fade-in": "fadeIn 200ms ease-out",
        "drop-in": "dropIn 200ms cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        dropIn: {
          "0%": { opacity: "0", transform: "scale(0.95) translateY(-6px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
