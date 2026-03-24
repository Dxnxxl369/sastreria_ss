/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        indigo: {
          50: '#eef2ff',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#1e1b4b',
        },
      },
    },
  },
  plugins: [],
}