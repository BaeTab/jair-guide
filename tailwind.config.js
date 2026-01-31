/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  safelist: [
    'from-blue-900', 'to-cyan-900',
    'from-yellow-600', 'to-orange-700',
    'from-red-700', 'to-pink-800',
    'from-gray-700', 'to-gray-900'
  ],
  plugins: [],
}
