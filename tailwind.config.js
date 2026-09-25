/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./*.html",
    "./*.js",
    "./api/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        'page-bg': '#f4f5fa',
        'sidebar-bg': '#322b49',
        'accent-red': '#f07167',
        'accent-purple': '#5352ed',
        'accent-yellow': '#ffa502',
        'accent-green': '#2ed573'
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif']
      }
    },
  },
  plugins: [],
}
