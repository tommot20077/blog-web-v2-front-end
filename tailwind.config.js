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
        bg:              'var(--bg)',
        'bg-sub':        'var(--bg-sub)',
        surface:         'var(--surface)',
        ink:             'var(--ink)',
        'ink-2':         'var(--ink-2)',
        muted:           'var(--muted)',
        'muted-2':       'var(--muted-2)',
        border:          'var(--border)',
        'border-strong': 'var(--border-strong)',
        divider:         'var(--divider)',
        glass:           'var(--glass)',
        accent:          'var(--accent)',
        'accent-ink':    'var(--accent-ink)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        sm:      'var(--radius-sm)',
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
