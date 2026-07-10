/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        zyft: {
          bg: "#0a0a0f",
          card: "#13131f",
          purple: "#7c3aed",
          "purple-light": "#a78bfa",
          accent: "#ec4899",
        },
      },
    },
  },
  plugins: [],
};