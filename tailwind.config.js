/** @type {import('tailwindcss').Config} */
module.exports = {
  // AJOUTE "./app/**/*.{js,jsx,ts,tsx}" ICI
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};