import type { Config } from 'tailwindcss'

/* ============================================================
   TLACUILO · Tailwind v3 config
   ============================================================
   Migrado de v4 (2026-07-11) para soportar navegadores viejos
   (Safari < 16.4, iPhones con iOS 14-15, etc.). Los tokens viven
   como CSS custom properties en globals.css (:root y .light-mode)
   para que el cambio de modo siga funcionando en runtime.

   - Colores fijos de marca: hex directo (soportan /opacidad).
   - Colores semánticos (cambian por modo): var(--color-x).
   ============================================================ */

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Brand (fijos, iguales en dark y light) */
        morado: '#6E6BA0',
        periwinkle: '#9D9BC8',
        tinta: '#15151D',
        bone: '#ECEAF0',
        dirty: '#E8DC4A',
        'lilac-depth': '#2A2838',
        'warm-white': '#F7F6FA',
        acid: '#B8F200',
        brillante: '#5930CB',
        fosfo: '#FF4D00',
        available: '#B8F200',
        loan: '#FF4D00',

        /* Semánticos (dependen del modo, definidos en globals.css) */
        bg: {
          DEFAULT: 'var(--color-bg)',
          card: 'var(--color-bg-card)',
          soft: 'var(--color-bg-soft)',
        },
        footer: 'var(--color-footer)',
        text: {
          DEFAULT: 'var(--color-text)',
          bright: 'var(--color-text-bright)',
          dim: 'var(--color-text-dim)',
          faint: 'var(--color-text-faint)',
        },
        rule: {
          DEFAULT: 'var(--color-rule)',
          strong: 'var(--color-rule-strong)',
        },
        invert: {
          bg: 'var(--color-invert-bg)',
          fg: 'var(--color-invert-fg)',
        },
      },
      fontFamily: {
        sans: ['var(--font-jost)', 'Jost', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'JetBrains Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
        micro: ['var(--font-space-mono)', 'Space Mono', 'var(--font-dm-mono)', 'DM Mono', 'ui-monospace', 'Menlo', 'monospace'],
        acacia: ['var(--font-acacia-otf)', 'Georgia', 'serif'],
        costa: ['var(--font-costa-otf)', 'Georgia', 'serif'],
        oaxaca: ['var(--font-oaxaca-prickly)', 'Georgia', 'serif'],
        /* futura nunca existió como token en v4; caía al sans del body.
           La definimos explícita al mismo Jost para no cambiar nada. */
        futura: ['var(--font-jost)', 'Jost', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        /* Paridad con v4: rounded-sm ahí es 0.25rem (en v3 era 0.125rem). */
        sm: '0.25rem',
      },
    },
  },
  plugins: [],
}

export default config
