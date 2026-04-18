/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        ink: 'var(--ink)',
        accent: 'var(--accent)',
        muted: 'var(--muted)',
        border: 'var(--border)',
        surface: 'var(--surface)',
      },
      fontFamily: {
        sans: ['var(--f-body)'],
        display: ['var(--f-display)'],
        mono: ['var(--f-mono)'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
