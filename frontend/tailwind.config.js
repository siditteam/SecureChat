/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#faf5fb',
          100: '#f3e4f6',
          200: '#e7c9ee',
          300: '#d5a0e1',
          400: '#be72cf',
          500: '#a84db8',
          600: '#8b3599',
          700: '#6e2778',
          800: '#531b5c',
          900: '#3a1040',
        },
        accent: {
          50:  '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f8b4d9',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
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
