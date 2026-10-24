/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        display: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        dot: ['Doto', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      colors: {
        // Palet B&W ala Nothing OS: nama token lama dipertahankan supaya komponen
        // tidak perlu diubah satu-satu. maroon = skala abu netral (hitam -> putih),
        // cream = putih/abu terang, blush = Nothing Red (satu-satunya aksen warna).
        maroon: {
          50: '#F5F5F5', 100: '#EDEDED', 200: '#D4D4D4', 300: '#A3A3A3', 400: '#7A7A7A',
          500: '#5C5C5C', 600: '#4A4A4A', 700: '#262626', 800: '#141414', 900: '#000000', 950: '#000000',
        },
        cream: { 50: '#FFFFFF', 100: '#F2F2F2', 200: '#E5E5E5' },
        blush: { 100: '#FDECED', 200: '#FF8A90', 600: '#D71921' },
        lavender: { 100: '#EDEDED', 200: '#CFCFCF', 600: '#555555' },
        sand: { 100: '#F0F0F0', 200: '#D9D9D9', 600: '#666666' },
        sage: { 100: '#EDEDED', 200: '#D4D4D4', 600: '#8A8A8A' },
      },
    },
  },
  plugins: [],
};
