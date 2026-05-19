/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          gold: '#C9A84C',
          dark: '#0D0D0D',
          surface: '#141414',
          border: '#2A2A2A',
          muted: '#888888',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
