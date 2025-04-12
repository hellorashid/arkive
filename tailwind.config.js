/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'tarot': ['Crimson Pro', 'serif'],
      },
      colors: {
        'tarot-dark': '#1A1A1A',
        'tarot-darker': '#121212',
        'tarot-light': '#2A2A2A',
        'tarot-gold': '#B9906B',
        'tarot-gold-light': '#D4B08C',
        'tarot-gold-dark': '#8B6B4A',
      },
      boxShadow: {
        'tarot': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'tarot-glow': '0 0 8px rgba(185, 144, 107, 0.15)',
      },
    },
  },
  plugins: [],
};
