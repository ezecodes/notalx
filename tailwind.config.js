/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["src/page.tsx"],
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
    extend: {},
  },
  plugins: [],
};
