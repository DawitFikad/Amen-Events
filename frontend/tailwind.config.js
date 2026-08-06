/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Light forest green brand scale
        brand: {
          50: '#f1f7f1',
          100: '#e1eee1',
          200: '#c4ddc4',
          300: '#9cc69c',
          400: '#71aa71',
          500: '#4c8f4c',
          600: '#126e12ff',
          700: '#0e5f0eff',
          800: '#175917',
          900: '#124112',
          950: '#082408',
        },
        // Warm gold accent — harmonizes with forest green
        gold: {
          50: '#fbf8ee',
          100: '#f5edcf',
          200: '#ead9a1',
          300: '#ddc271',
          400: '#d1aa4d',
          500: '#c9a227',
          600: '#a97e30',
          700: '#8a6327',
          800: '#714f24',
          900: '#5d4121',
        },
        // Public portal brand — same forest green family as `brand`
        portal: {
          50: '#f0f7f0',
          100: '#dcebdc',
          200: '#bad9ba',
          300: '#8fc48f',
          400: '#57a857',
          500: '#228B22',
          600: '#1c721c',
          700: '#165916',
          800: '#114511',
          900: '#0c320c',
          950: '#062106',
        },
        ink: '#122c12',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(8,36,8,0.05), 0 1px 3px rgba(8,36,8,0.08)',
        pop: '0 8px 24px rgba(8,36,8,0.12)',
      },
      borderRadius: {
        xl2: '1rem',
      },
    },
  },
  plugins: [],
}