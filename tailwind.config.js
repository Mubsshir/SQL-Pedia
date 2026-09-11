/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gw: {
          bg: '#f8fafc',
          surface: '#ffffff',
          card: '#ffffff',
          cardHover: '#f0fdf4',
          border: '#e2e8f0',
          borderGreen: '#86efac',
          green: '#059669',
          greenDark: '#047857',
          greenDeep: '#064e3b',
          greenLight: '#ecfdf5',
        },
        sql: {
          bg: '#080d0b',
          surface: '#0d1613',
          card: '#12201b',
          cardHover: '#182b24',
          border: '#1f382f',
          borderLight: '#2c4d41',
          keyword: '#34d399',
          func: '#a7f3d0',
          dmv: '#10b981',
          string: '#fef08a',
          comment: '#6ee7b7',
          number: '#f97316',
          type: '#6ee7b7',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Cascadia Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
