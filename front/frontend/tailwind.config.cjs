/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
        cute: ['ZCOOL KuaiLe', 'cursive'],
      },
      colors: {
        rose: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
        candy: {
          pink: '#FFDEE9',
          blue: '#B5FFFC',
          yellow: '#FFF9C4',
          purple: '#E1BEE7',
        },
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        'heart-beat': 'heart-beat 1.5s ease-in-out infinite',
        wobble: 'wobble 0.5s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'heart-beat': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
        },
        wobble: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/line-clamp')],
};

