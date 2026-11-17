/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blue: { 600: '#0560e8', 700: '#004fc4' },
        brand: {
          50: '#f4f8ff',
          100: '#e2eeff',
          500: '#2978ee',
          600: '#0560e8',
          700: '#004fc4',
          800: '#003b99',
          900: '#002b70',
        },
        knooviq: {
          primary: '#0560e8',
          accent: '#0560e8',
          secondary: '#0f172a'
        }
      }
    },
  },
  plugins: [],
}
