/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: ['selector', '.app-dark'],
  theme: {
    extend: {
      colors: {
        // All colours come from CSS tokens in styles.css (light + dark).
        bg: 'var(--ll-bg)',
        surface: 'var(--ll-surface)',
        'surface-2': 'var(--ll-surface-2)',
        line: 'var(--ll-border)',
        ink: 'var(--ll-text)',
        muted: 'var(--ll-muted)',
        brand: 'var(--ll-brand)',
        'brand-soft': 'var(--ll-brand-soft)',
        'on-brand': 'var(--ll-on-brand)',
        sand: 'var(--ll-sand)',
        ok: 'var(--ll-ok)',
        warn: 'var(--ll-warn)',
        err: 'var(--ll-err)',
      },
      fontFamily: {
        display: ['"Fraunces Variable"', 'Georgia', 'serif'],
        sans: ['"Manrope Variable"', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      maxWidth: { content: '76rem' },
    },
  },
  plugins: [],
};
