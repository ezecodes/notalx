import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // or 'media' for media-query based dark mode
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      "1micro": "320px",
      "2micro": "375px",
      "3micro": "425px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
    },
    extend: {
      keyframes: {
        zoomIn: {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        zoomOut: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.5)", opacity: "0" },
        },
      },
      animation: {
        zoomIn: "zoomIn 0.3s ease-out",
        zoomOut: "zoomOut 0.3s ease-in",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        // Add your custom colors for dark mode
        dark: {
          primary: "#1d2c35", // Dark primary color
          background: "#121212", // Dark background color
          text: "#e0e0e0", // Light text color for dark mode
        },
      },
    },
  },
  plugins: [],
};
export default config;
