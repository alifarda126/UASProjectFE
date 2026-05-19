/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#083D56',
          light: '#0C5272',
          dark: '#052B3D',
          50: '#E8F0F4',
        },
        secondary: {
          DEFAULT: '#546E7A',
          light: '#78909C',
          dark: '#37474F',
          50: '#ECEFF1',
        },
        tertiary: {
          DEFAULT: '#00695C',
          light: '#00897B',
          dark: '#004D40',
          50: '#E0F2F1',
        },
        neutral: {
          DEFAULT: '#767779',
          light: '#9E9E9E',
          dark: '#424242',
          50: '#F5F5F5',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
