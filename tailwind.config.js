/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nexus: {
          950: '#050508',
          900: '#0a0a0f',
          850: '#0d0d15',
          800: '#111118',
          750: '#151520',
          700: '#1a1a25',
          650: '#1f1f30',
          600: '#24243a',
          500: '#2e2e4a',
          450: '#3d3d60',
          400: '#5555aa',
          350: '#6e6ec0',
          300: '#8888dd',
          200: '#aaaaff',
          100: '#ccccff',
        },
        emerald: { 400: '#34d399', 500: '#10b981' },
      },
      fontFamily: {
        sans: ['Fira Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
