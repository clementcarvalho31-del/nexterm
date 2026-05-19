import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './modules/**/*.{ts,tsx}',
    './layouts/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        term: {
          bg:     '#0a0c0f',
          bg2:    '#0d1117',
          bg3:    '#0f1520',
          bg4:    '#131821',
          border: '#1e2530',
          border2:'#2a3444',
          text:   '#c8cdd6',
          text2:  '#8a9ab0',
          text3:  '#5a6373',
          gold:   '#f0b429',
          green:  '#22c55e',
          red:    '#ef4444',
          blue:   '#378add',
          purple: '#7f77dd',
        },
      },
      fontFamily: {
        mono: ['"Courier New"', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['9px', '1.3'],
        xs:    ['10px', '1.4'],
        sm:    ['11px', '1.5'],
        base:  ['12px', '1.6'],
      },
      keyframes: {
        pulse2: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
        scrollX: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        pulse2:  'pulse2 2s ease-in-out infinite',
        scrollX: 'scrollX 60s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
