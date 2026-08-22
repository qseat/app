/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        surface2: 'var(--surface-2)',
        surface3: 'var(--surface-3)',
        card: 'var(--surface)',
        card2: 'var(--surface-2)',
        fg: 'var(--fg)',
        fg2: 'var(--fg-2)',
        muted: 'var(--muted)',
        faint: 'var(--faint)',
        gold: 'var(--gold)',
        goldsoft: 'var(--gold-soft)',
        goldt: 'var(--gold-text)',
        hair: 'var(--hair)',
        hair2: 'var(--hair)',
        burg: 'var(--danger)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        lg: 'var(--shadow-lg)',
      },
      fontFamily: {
        display: ['Jost', 'system-ui', 'sans-serif'],
        ui: ['Jost', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
