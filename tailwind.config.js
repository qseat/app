/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        card: 'var(--card)',
        card2: 'var(--card2)',
        fg: 'var(--fg)',
        fg2: 'var(--fg2)',
        muted: 'var(--muted)',
        gold: 'var(--gold)',
        goldt: 'var(--gold-text)',
        hair: 'var(--hair)',
        hair2: 'var(--hair2)',
        burg: 'var(--burg)',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        ui: ['Jost', 'system-ui', 'sans-serif'],
      },
      borderRadius: { none: '0' },
    },
  },
  plugins: [],
}
