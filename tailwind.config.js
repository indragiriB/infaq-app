/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      colors: {
        maroon: {
          50: '#FBF3EC',
          100: '#F4E3DA',
          200: '#E4C7BE',
          300: '#C99A93',
          400: '#A66C6C',
          500: '#7A4C4E',
          600: '#5C3A3F',
          700: '#4A3339',
          800: '#3D2A2E',
          900: '#2B1B1E',
        },
        cream: {
          50: '#FFFDFB',
          100: '#FBF3EC',
          200: '#F5E8DE',
        },
        blush: {
          100: '#FCE4EA',
          200: '#F3C9D3',
          600: '#D9607E',
        },
        lavender: {
          100: '#ECE9FA',
          200: '#DAD6F2',
          600: '#8B7FD6',
        },
        sand: {
          100: '#FBF0D9',
          200: '#F6DDA0',
          600: '#C99A2E',
        },
        sage: {
          100: '#E6F0E4',
          200: '#C9E2C6',
          600: '#5E9C5A',
        },
      },
    },
  },
  plugins: [],
};
