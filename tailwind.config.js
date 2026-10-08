/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0F172A',
          dark: '#0A0F1D',
          light: '#1E293B',
        },
        // Strict Theme Accent: #A44101
        themeColor: {
          DEFAULT: '#A44101',
          hover: '#8C3701',
          dark: '#732D00',
          light: '#FDF4EC',
        },
        rust: {
          DEFAULT: '#A44101',
          hover: '#8C3701',
          dark: '#732D00',
          light: '#FDF4EC',
        },
        gold: {
          DEFAULT: '#A44101',
          hover: '#8C3701',
          dark: '#732D00',
          light: '#FDF4EC',
        },
        saffron: {
          DEFAULT: '#A44101',
          hover: '#8C3701',
          dark: '#732D00',
          light: '#FDF4EC',
        },
        warmYellow: {
          DEFAULT: '#A44101',
          dark: '#8C3701',
        },
        saleRed: {
          DEFAULT: '#A44101',
          dark: '#8C3701',
        },
        beige: {
          DEFAULT: '#F8FAFC',
          hover: '#F1F5F9',
          dark: '#E2E8F0',
          light: '#F8FAFC',
        },
        canvas: '#FFFFFF',
        charcoal: '#0F172A',
        mutedGray: '#64748B',
      },
      fontFamily: {
        roboto: ['Roboto', 'sans-serif'],
      },
      borderRadius: {
        'theme-sm': '10px',
        'theme': '12px',
        'theme-lg': '14px',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(15, 31, 61, 0.06)',
        'soft-hover': '0 10px 25px -4px rgba(15, 31, 61, 0.1)',
        'card': '0 2px 12px 0 rgba(15, 31, 61, 0.05)',
      },
    },
  },
  plugins: [],
}
