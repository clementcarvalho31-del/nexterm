import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './modules/**/*.{ts,tsx}',
    './layouts/**/*.{ts,tsx}',
    './workspace/**/*.{ts,tsx}',
    './chart-engine/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // CSS-var-backed semantic colors — use these in Tailwind classes
        't-surface': {
          base:     'var(--t-surface-base)',
          panel:    'var(--t-surface-panel)',
          elevated: 'var(--t-surface-elevated)',
          overlay:  'var(--t-surface-overlay)',
          hover:    'var(--t-surface-hover)',
          active:   'var(--t-surface-active)',
        },
        't-border': {
          subtle:  'var(--t-border-subtle)',
          default: 'var(--t-border-default)',
          strong:  'var(--t-border-strong)',
          focus:   'var(--t-border-focus)',
          accent:  'var(--t-border-accent)',
        },
        't-text': {
          primary:   'var(--t-text-primary)',
          secondary: 'var(--t-text-secondary)',
          muted:     'var(--t-text-muted)',
          disabled:  'var(--t-text-disabled)',
          inverse:   'var(--t-text-inverse)',
          heading:   'var(--t-text-heading)',
        },
        't-accent': {
          primary:   'var(--t-accent-primary)',
          secondary: 'var(--t-accent-secondary)',
          tertiary:  'var(--t-accent-tertiary)',
          muted:     'var(--t-accent-muted)',
        },
        't-market': {
          up:        'var(--t-market-up)',
          'up-muted':'var(--t-market-up-muted)',
          down:      'var(--t-market-down)',
          'dn-muted':'var(--t-market-down-muted)',
          neutral:   'var(--t-market-neutral)',
        },
        't-status': {
          success: 'var(--t-status-success)',
          warning: 'var(--t-status-warning)',
          danger:  'var(--t-status-danger)',
          info:    'var(--t-status-info)',
          live:    'var(--t-status-live)',
        },
        // Legacy aliases (keep existing components working)
        term: {
          bg:     'var(--t-surface-base)',
          bg2:    'var(--t-surface-panel)',
          bg3:    'var(--t-surface-elevated)',
          bg4:    'var(--t-surface-hover)',
          border: 'var(--t-border-default)',
          border2:'var(--t-border-strong)',
          text:   'var(--t-text-primary)',
          text2:  'var(--t-text-secondary)',
          text3:  'var(--t-text-muted)',
          gold:   'var(--t-accent-primary)',
          green:  'var(--t-market-up)',
          red:    'var(--t-market-down)',
          blue:   'var(--t-accent-secondary)',
          purple: 'var(--t-accent-tertiary)',
        },
      },
      fontFamily: {
        mono:    ['var(--t-font-mono)'],
        sans:    ['var(--t-font-sans)'],
        display: ['var(--t-font-display)'],
      },
      fontSize: {
        '2xs': ['var(--t-size-2xs)', { lineHeight: '1.3' }],
        xs:    ['var(--t-size-xs)',   { lineHeight: '1.4' }],
        sm:    ['var(--t-size-sm)',   { lineHeight: '1.5' }],
        base:  ['var(--t-size-base)', { lineHeight: '1.6' }],
        md:    ['var(--t-size-md)',   { lineHeight: '1.6' }],
        lg:    ['var(--t-size-lg)',   { lineHeight: '1.5' }],
      },
      spacing: {
        'px':  'var(--t-space-px)',
        '0.5': 'var(--t-space-1)',
        '1':   'var(--t-space-2)',
        '1.5': 'var(--t-space-3)',
        '2':   'var(--t-space-4)',
        '2.5': 'var(--t-space-5)',
        '3':   'var(--t-space-6)',
        '4':   'var(--t-space-8)',
      },
      borderRadius: {
        none: '0',
        sm:   'var(--t-radius-sm)',
        DEFAULT: 'var(--t-radius-md)',
        lg:   'var(--t-radius-lg)',
        full: '9999px',
      },
      boxShadow: {
        sm:    'var(--t-shadow-sm)',
        md:    'var(--t-shadow-md)',
        lg:    'var(--t-shadow-lg)',
        panel: 'var(--t-shadow-panel)',
        float: 'var(--t-shadow-float)',
      },
      keyframes: {
        pulse2:   { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.35' } },
        'scrollX':{ from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        tickUp:   { '0%,100%': { backgroundColor: 'transparent' }, '20%': { backgroundColor: 'var(--t-market-up-muted)' } },
        tickDown: { '0%,100%': { backgroundColor: 'transparent' }, '20%': { backgroundColor: 'var(--t-market-down-muted)' } },
      },
      animation: {
        pulse2:   'pulse2 2s ease-in-out infinite',
        scrollX:  'scrollX 55s linear infinite',
        tickUp:   'tickUp 0.6s ease-out forwards',
        tickDown: 'tickDown 0.6s ease-out forwards',
      },
      transitionDuration: {
        fast: 'var(--t-motion-fast)',
        base: 'var(--t-motion-base)',
        slow: 'var(--t-motion-slow)',
      },
    },
  },
  plugins: [],
}

export default config
