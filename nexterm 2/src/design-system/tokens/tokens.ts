/**
 * NEXTERM Design Tokens
 * ─────────────────────────────────────────────────────────────────────────────
 * All values expressed as CSS custom property names.
 * Never use raw hex in components — always reference a token.
 *
 * Token naming convention:
 *   --t-{category}-{role}-{variant}
 *   e.g. --t-surface-panel, --t-text-muted, --t-market-up
 */

// ─── Token categories ─────────────────────────────────────────────────────────

/** All CSS variable names used in the system */
export const T = {
  // ── Surfaces ───────────────────────────────────────────────────────────────
  surface: {
    base:     'var(--t-surface-base)',      // deepest background
    panel:    'var(--t-surface-panel)',     // panel/card background
    elevated: 'var(--t-surface-elevated)', // header, toolbar
    overlay:  'var(--t-surface-overlay)',  // dropdowns, modals, tooltips
    hover:    'var(--t-surface-hover)',    // hover state
    active:   'var(--t-surface-active)',   // active/selected state
    glass:    'var(--t-surface-glass)',    // glassmorphism surface
  },

  // ── Borders ────────────────────────────────────────────────────────────────
  border: {
    subtle:   'var(--t-border-subtle)',    // faintest dividers
    default:  'var(--t-border-default)',   // standard borders
    strong:   'var(--t-border-strong)',    // emphasized borders
    focus:    'var(--t-border-focus)',     // focus rings
    accent:   'var(--t-border-accent)',    // accent / gold highlight
  },

  // ── Text ───────────────────────────────────────────────────────────────────
  text: {
    primary:   'var(--t-text-primary)',    // main readable text
    secondary: 'var(--t-text-secondary)', // supporting text
    muted:     'var(--t-text-muted)',     // labels, metadata
    disabled:  'var(--t-text-disabled)',  // disabled state
    inverse:   'var(--t-text-inverse)',   // text on bright backgrounds
    heading:   'var(--t-text-heading)',   // section titles
  },

  // ── Accent ─────────────────────────────────────────────────────────────────
  accent: {
    primary:   'var(--t-accent-primary)',   // brand gold
    secondary: 'var(--t-accent-secondary)', // brand blue
    tertiary:  'var(--t-accent-tertiary)',  // purple
    muted:     'var(--t-accent-muted)',    // faded accent
  },

  // ── Market ─────────────────────────────────────────────────────────────────
  market: {
    up:         'var(--t-market-up)',          // bullish / positive
    upMuted:    'var(--t-market-up-muted)',    // bullish bg tint
    upBody:     'var(--t-market-up-body)',     // candle body up
    upWick:     'var(--t-market-up-wick)',     // candle wick up
    down:       'var(--t-market-down)',        // bearish / negative
    downMuted:  'var(--t-market-down-muted)', // bearish bg tint
    downBody:   'var(--t-market-down-body)',  // candle body down
    downWick:   'var(--t-market-down-wick)',  // candle wick down
    neutral:    'var(--t-market-neutral)',    // flat / no change
    volume:     'var(--t-market-volume)',     // volume bars
  },

  // ── Status / Semantic ──────────────────────────────────────────────────────
  status: {
    success:     'var(--t-status-success)',
    successMuted:'var(--t-status-success-muted)',
    warning:     'var(--t-status-warning)',
    warningMuted:'var(--t-status-warning-muted)',
    danger:      'var(--t-status-danger)',
    dangerMuted: 'var(--t-status-danger-muted)',
    info:        'var(--t-status-info)',
    infoMuted:   'var(--t-status-info-muted)',
    live:        'var(--t-status-live)',     // live/streaming indicator
  },

  // ── News impact badges ─────────────────────────────────────────────────────
  impact: {
    high:   'var(--t-impact-high)',
    highBg: 'var(--t-impact-high-bg)',
    med:    'var(--t-impact-med)',
    medBg:  'var(--t-impact-med-bg)',
    low:    'var(--t-impact-low)',
    lowBg:  'var(--t-impact-low-bg)',
  },

  // ── Chart ──────────────────────────────────────────────────────────────────
  chart: {
    bg:          'var(--t-chart-bg)',
    grid:        'var(--t-chart-grid)',
    axis:        'var(--t-chart-axis)',
    crosshair:   'var(--t-chart-crosshair)',
    crosshairBg: 'var(--t-chart-crosshair-bg)',
    ema20:       'var(--t-chart-ema20)',
    ema50:       'var(--t-chart-ema50)',
    ema200:      'var(--t-chart-ema200)',
    vwap:        'var(--t-chart-vwap)',
    levelR:      'var(--t-chart-level-r)',
    levelS:      'var(--t-chart-level-s)',
    levelP:      'var(--t-chart-level-p)',
  },

  // ── Typography ─────────────────────────────────────────────────────────────
  font: {
    mono:    'var(--t-font-mono)',
    sans:    'var(--t-font-sans)',
    display: 'var(--t-font-display)',
  },

  // ── Sizing ─────────────────────────────────────────────────────────────────
  size: {
    '2xs': 'var(--t-size-2xs)',  // 8px
    xs:    'var(--t-size-xs)',   // 9px
    sm:    'var(--t-size-sm)',   // 10px
    base:  'var(--t-size-base)', // 11px
    md:    'var(--t-size-md)',   // 12px
    lg:    'var(--t-size-lg)',   // 13px
    xl:    'var(--t-size-xl)',   // 16px
    '2xl': 'var(--t-size-2xl)', // 20px
    '3xl': 'var(--t-size-3xl)', // 24px
  },

  // ── Spacing ────────────────────────────────────────────────────────────────
  space: {
    px:  'var(--t-space-px)',  // 1px
    '1': 'var(--t-space-1)',   // 2px
    '2': 'var(--t-space-2)',   // 4px
    '3': 'var(--t-space-3)',   // 6px
    '4': 'var(--t-space-4)',   // 8px
    '5': 'var(--t-space-5)',   // 10px
    '6': 'var(--t-space-6)',   // 12px
    '8': 'var(--t-space-8)',   // 16px
  },

  // ── Radius ─────────────────────────────────────────────────────────────────
  radius: {
    none: '0',
    sm:   'var(--t-radius-sm)',  // 2px
    md:   'var(--t-radius-md)',  // 3px
    lg:   'var(--t-radius-lg)',  // 4px
    full: '9999px',
  },

  // ── Shadow ─────────────────────────────────────────────────────────────────
  shadow: {
    sm:     'var(--t-shadow-sm)',
    md:     'var(--t-shadow-md)',
    lg:     'var(--t-shadow-lg)',
    panel:  'var(--t-shadow-panel)',
    float:  'var(--t-shadow-float)',
  },

  // ── Animation ─────────────────────────────────────────────────────────────
  motion: {
    fast:   'var(--t-motion-fast)',    // 80ms
    base:   'var(--t-motion-base)',    // 150ms
    slow:   'var(--t-motion-slow)',    // 250ms
    ease:   'var(--t-motion-ease)',    // cubic-bezier
    spring: 'var(--t-motion-spring)', // spring easing
  },
} as const

// ─── Type helpers ─────────────────────────────────────────────────────────────
export type TokenPath = string   // 'var(--t-...)'

// Convenience: raw CSS variable name (without var())
export function cssVar(name: string): string {
  return `--t-${name}`
}
