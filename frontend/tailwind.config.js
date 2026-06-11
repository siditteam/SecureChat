/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#E6F9F9',
          100: '#B3EFEF',
          200: '#80E5E5',
          300: '#4DDBDB',
          400: '#26C0C0',
          500: '#0AA3A3',
          600: '#088080',
          700: '#066060',
          800: '#044040',
          900: '#022222',
          950: '#011111',
        },
        accent: {
          50:  '#FFF3E0',
          100: '#FFE0B2',
          200: '#FFCC80',
          300: '#FFB74D',
          400: '#FFA726',
          500: '#FF9800',
          600: '#FB8C00',
          700: '#F57C00',
          800: '#EF6C00',
          900: '#E65100',
        },
        ink: {
          950: '#07050B',
          900: '#0C0A12',
          800: '#12101A',
          700: '#1A1625',
          600: '#221E30',
          500: '#2B2740',
        },
        success: '#10b981',
        warning: '#f59e0b',
        error:   '#ef4444',
      },
    },
  },
  plugins: [],
};
