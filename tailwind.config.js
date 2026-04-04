/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './screens/**/*.{ts,tsx}',
    './routes/**/*.{ts,tsx}',
    './store/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
    './data/**/*.{ts,tsx}',
    './utils/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0d8ea5',
          dark: '#0a7385',
          light: '#208192',
        },
        background: {
          light: '#f6f8f8',
          dark: '#101f22',
          card: '#1a2c30',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
};
