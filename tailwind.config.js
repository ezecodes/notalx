/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["src/client/**/*.tsx"],
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
    },
  },
  plugins: [],
};
