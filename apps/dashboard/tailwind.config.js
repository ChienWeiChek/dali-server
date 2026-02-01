/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    // Remove Preflight if it conflicts with MUI, but usually it's fine or we disable it
    // preflight: false,
  }
}
