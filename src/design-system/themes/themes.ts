export type ThemeId = 'dark-terminal' | 'dark-pro' | 'dark-midnight' | 'light-clean'

export interface ThemeTokens {
  // Surfaces
  'surface-base':     string
  'surface-panel':    string
  'surface-elevated': string
  'surface-overlay':  string
  'surface-hover':    string
  'surface-active':   string
  'surface-glass':    string

  // Borders
  'border-subtle':    string
  'border-default':   string
  'border-strong':    string
  'border-focus':     string
  'border-accent':    string

  // Text
  'text-primary':     string
  'text-secondary':   string
  'text-muted':       string
  'text-disabled':    string
  'text-inverse':     string
  'text-heading':     string

  // Accent
  'accent-primary':   string
  'accent-secondary': string
  'accent-tertiary':  string
  'accent-muted':     string

  // Market
  'market-up':        string
  'market-up-muted':  string
  'market-up-body':   string
  'market-up-wick':   string
  'market-down':      string
  'market-down-muted':string
  'market-down-body': string
  'market-down-wick': string
  'market-neutral':   string
  'market-volume':    string

  // Status
  'status-success':       string
  'status-success-muted': string
  'status-warning':       string
  'status-warning-muted': string
  'status-danger':        string
  'status-danger-muted':  string
  'status-info':          string
  'status-info-muted':    string
  'status-live':          string

  // Impact
  'impact-high':    string
  'impact-high-bg': string
  'impact-med':     string
  'impact-med-bg':  string
  'impact-low':     string
  'impact-low-bg':  string

  // Chart
  'chart-bg':           string
  'chart-grid':         string
  'chart-axis':         string
  'chart-crosshair':    string
  'chart-crosshair-bg': string
  'chart-ema20':        string
  'chart-ema50':        string
  'chart-ema200':       string
  'chart-vwap':         string
  'chart-level-r':      string
  'chart-level-s':      string
  'chart-level-p':      string

  // Shadows
  'shadow-sm':    string
  'shadow-md':    string
  'shadow-lg':    string
  'shadow-panel': string
  'shadow-float': string
}

// ─── Dark Terminal (Bloomberg-inspired) ──────────────────────────────────────
const darkTerminal: ThemeTokens = {
  'surface-base':      '#0a0c0f',
  'surface-panel':     '#0d1117',
  'surface-elevated':  '#0f1520',
  'surface-overlay':   '#111827',
  'surface-hover':     '#131821',
  'surface-active':    '#1a2130',
  'surface-glass':     'rgba(13,17,23,0.85)',

  'border-subtle':     '#111820',
  'border-default':    '#1e2530',
  'border-strong':     '#2a3444',
  'border-focus':      '#f0b429',
  'border-accent':     '#f0b42940',

  'text-primary':      '#c8cdd6',
  'text-secondary':    '#8a9ab0',
  'text-muted':        '#5a6373',
  'text-disabled':     '#3d4a5a',
  'text-inverse':      '#0a0c0f',
  'text-heading':      '#e2e8f0',

  'accent-primary':    '#f0b429',
  'accent-secondary':  '#378add',
  'accent-tertiary':   '#7f77dd',
  'accent-muted':      '#f0b42920',

  'market-up':         '#22c55e',
  'market-up-muted':   'rgba(34,197,94,0.12)',
  'market-up-body':    '#1a7a4a',
  'market-up-wick':    '#22c55e',
  'market-down':       '#ef4444',
  'market-down-muted': 'rgba(239,68,68,0.12)',
  'market-down-body':  '#7a1a1a',
  'market-down-wick':  '#ef4444',
  'market-neutral':    '#5a6373',
  'market-volume':     'rgba(90,99,115,0.3)',

  'status-success':        '#22c55e',
  'status-success-muted':  'rgba(34,197,94,0.12)',
  'status-warning':        '#f0b429',
  'status-warning-muted':  'rgba(240,180,41,0.12)',
  'status-danger':         '#ef4444',
  'status-danger-muted':   'rgba(239,68,68,0.12)',
  'status-info':           '#378add',
  'status-info-muted':     'rgba(55,138,221,0.12)',
  'status-live':           '#22c55e',

  'impact-high':     '#ef4444',
  'impact-high-bg':  '#3d1515',
  'impact-med':      '#f0b429',
  'impact-med-bg':   '#2a2a0a',
  'impact-low':      '#378add',
  'impact-low-bg':   '#0d1f35',

  'chart-bg':           '#0a0c0f',
  'chart-grid':         '#131821',
  'chart-axis':         '#5a6373',
  'chart-crosshair':    '#f0b429',
  'chart-crosshair-bg': '#0a0c0f',
  'chart-ema20':        'rgba(240,180,41,0.75)',
  'chart-ema50':        'rgba(55,138,221,0.75)',
  'chart-ema200':       'rgba(127,119,221,0.55)',
  'chart-vwap':         'rgba(34,197,94,0.65)',
  'chart-level-r':      'rgba(239,68,68,0.8)',
  'chart-level-s':      'rgba(34,197,94,0.8)',
  'chart-level-p':      'rgba(240,180,41,0.8)',

  'shadow-sm':    '0 1px 3px rgba(0,0,0,0.5)',
  'shadow-md':    '0 4px 12px rgba(0,0,0,0.6)',
  'shadow-lg':    '0 8px 24px rgba(0,0,0,0.7)',
  'shadow-panel': '0 2px 8px rgba(0,0,0,0.4)',
  'shadow-float': '0 16px 48px rgba(0,0,0,0.8)',
}

// ─── Dark Pro (TradingView-inspired) ─────────────────────────────────────────
const darkPro: ThemeTokens = {
  'surface-base':      '#131722',
  'surface-panel':     '#1c2030',
  'surface-elevated':  '#1e2436',
  'surface-overlay':   '#232b3d',
  'surface-hover':     '#1e2840',
  'surface-active':    '#243050',
  'surface-glass':     'rgba(28,32,48,0.88)',

  'border-subtle':     '#1a2030',
  'border-default':    '#2a2e3d',
  'border-strong':     '#3a3e50',
  'border-focus':      '#2962ff',
  'border-accent':     '#2962ff40',

  'text-primary':      '#d1d4dc',
  'text-secondary':    '#787b86',
  'text-muted':        '#4c5063',
  'text-disabled':     '#363a45',
  'text-inverse':      '#131722',
  'text-heading':      '#e2e5ed',

  'accent-primary':    '#2962ff',
  'accent-secondary':  '#00bcd4',
  'accent-tertiary':   '#8b5cf6',
  'accent-muted':      '#2962ff20',

  'market-up':         '#26a69a',
  'market-up-muted':   'rgba(38,166,154,0.15)',
  'market-up-body':    '#26a69a',
  'market-up-wick':    '#26a69a',
  'market-down':       '#ef5350',
  'market-down-muted': 'rgba(239,83,80,0.15)',
  'market-down-body':  '#ef5350',
  'market-down-wick':  '#ef5350',
  'market-neutral':    '#787b86',
  'market-volume':     'rgba(120,123,134,0.3)',

  'status-success':        '#26a69a',
  'status-success-muted':  'rgba(38,166,154,0.15)',
  'status-warning':        '#ff9800',
  'status-warning-muted':  'rgba(255,152,0,0.15)',
  'status-danger':         '#ef5350',
  'status-danger-muted':   'rgba(239,83,80,0.15)',
  'status-info':           '#2962ff',
  'status-info-muted':     'rgba(41,98,255,0.15)',
  'status-live':           '#26a69a',

  'impact-high':     '#ef5350',
  'impact-high-bg':  '#3d1010',
  'impact-med':      '#ff9800',
  'impact-med-bg':   '#2a1a00',
  'impact-low':      '#2962ff',
  'impact-low-bg':   '#0a1530',

  'chart-bg':           '#131722',
  'chart-grid':         '#1e2436',
  'chart-axis':         '#4c5063',
  'chart-crosshair':    '#9598a1',
  'chart-crosshair-bg': '#131722',
  'chart-ema20':        'rgba(255,152,0,0.75)',
  'chart-ema50':        'rgba(41,98,255,0.75)',
  'chart-ema200':       'rgba(139,92,246,0.55)',
  'chart-vwap':         'rgba(38,166,154,0.65)',
  'chart-level-r':      'rgba(239,83,80,0.8)',
  'chart-level-s':      'rgba(38,166,154,0.8)',
  'chart-level-p':      'rgba(255,152,0,0.8)',

  'shadow-sm':    '0 1px 4px rgba(0,0,0,0.5)',
  'shadow-md':    '0 4px 16px rgba(0,0,0,0.55)',
  'shadow-lg':    '0 8px 32px rgba(0,0,0,0.65)',
  'shadow-panel': '0 2px 10px rgba(0,0,0,0.4)',
  'shadow-float': '0 16px 56px rgba(0,0,0,0.75)',
}

// ─── Dark Midnight (Reuters Eikon-inspired) ───────────────────────────────────
const darkMidnight: ThemeTokens = {
  'surface-base':      '#070a12',
  'surface-panel':     '#0b0f1a',
  'surface-elevated':  '#0e1422',
  'surface-overlay':   '#121828',
  'surface-hover':     '#141c2a',
  'surface-active':    '#1a2436',
  'surface-glass':     'rgba(11,15,26,0.90)',

  'border-subtle':     '#0f1520',
  'border-default':    '#1a2234',
  'border-strong':     '#253040',
  'border-focus':      '#00d4aa',
  'border-accent':     '#00d4aa30',

  'text-primary':      '#b8c4d4',
  'text-secondary':    '#6a7a90',
  'text-muted':        '#3d4e62',
  'text-disabled':     '#2a3444',
  'text-inverse':      '#070a12',
  'text-heading':      '#d0dce8',

  'accent-primary':    '#00d4aa',
  'accent-secondary':  '#0088cc',
  'accent-tertiary':   '#6644cc',
  'accent-muted':      '#00d4aa18',

  'market-up':         '#00cc88',
  'market-up-muted':   'rgba(0,204,136,0.12)',
  'market-up-body':    '#006644',
  'market-up-wick':    '#00cc88',
  'market-down':       '#ff4455',
  'market-down-muted': 'rgba(255,68,85,0.12)',
  'market-down-body':  '#882233',
  'market-down-wick':  '#ff4455',
  'market-neutral':    '#4a5566',
  'market-volume':     'rgba(74,85,102,0.3)',

  'status-success':        '#00cc88',
  'status-success-muted':  'rgba(0,204,136,0.12)',
  'status-warning':        '#ffaa00',
  'status-warning-muted':  'rgba(255,170,0,0.12)',
  'status-danger':         '#ff4455',
  'status-danger-muted':   'rgba(255,68,85,0.12)',
  'status-info':           '#0088cc',
  'status-info-muted':     'rgba(0,136,204,0.12)',
  'status-live':           '#00cc88',

  'impact-high':     '#ff4455',
  'impact-high-bg':  '#380010',
  'impact-med':      '#ffaa00',
  'impact-med-bg':   '#281800',
  'impact-low':      '#0088cc',
  'impact-low-bg':   '#001830',

  'chart-bg':           '#070a12',
  'chart-grid':         '#0e1422',
  'chart-axis':         '#3d4e62',
  'chart-crosshair':    '#00d4aa',
  'chart-crosshair-bg': '#070a12',
  'chart-ema20':        'rgba(255,170,0,0.75)',
  'chart-ema50':        'rgba(0,136,204,0.75)',
  'chart-ema200':       'rgba(102,68,204,0.55)',
  'chart-vwap':         'rgba(0,204,136,0.65)',
  'chart-level-r':      'rgba(255,68,85,0.8)',
  'chart-level-s':      'rgba(0,204,136,0.8)',
  'chart-level-p':      'rgba(255,170,0,0.8)',

  'shadow-sm':    '0 1px 4px rgba(0,0,0,0.7)',
  'shadow-md':    '0 4px 16px rgba(0,0,0,0.75)',
  'shadow-lg':    '0 8px 32px rgba(0,0,0,0.85)',
  'shadow-panel': '0 2px 10px rgba(0,0,0,0.6)',
  'shadow-float': '0 20px 60px rgba(0,0,0,0.9)',
}

// ─── Light Clean ──────────────────────────────────────────────────────────────
const lightClean: ThemeTokens = {
  'surface-base':      '#f0f2f5',
  'surface-panel':     '#ffffff',
  'surface-elevated':  '#f5f7fa',
  'surface-overlay':   '#ffffff',
  'surface-hover':     '#eef1f5',
  'surface-active':    '#e4eaf2',
  'surface-glass':     'rgba(255,255,255,0.85)',

  'border-subtle':     '#e8ecf0',
  'border-default':    '#d0d8e4',
  'border-strong':     '#b0bcc8',
  'border-focus':      '#2962ff',
  'border-accent':     '#2962ff30',

  'text-primary':      '#1a2030',
  'text-secondary':    '#4a5566',
  'text-muted':        '#7a8a9a',
  'text-disabled':     '#b0bcc8',
  'text-inverse':      '#ffffff',
  'text-heading':      '#0d1520',

  'accent-primary':    '#2962ff',
  'accent-secondary':  '#00897b',
  'accent-tertiary':   '#6200ea',
  'accent-muted':      '#2962ff15',

  'market-up':         '#00897b',
  'market-up-muted':   'rgba(0,137,123,0.1)',
  'market-up-body':    '#00897b',
  'market-up-wick':    '#00897b',
  'market-down':       '#d32f2f',
  'market-down-muted': 'rgba(211,47,47,0.1)',
  'market-down-body':  '#d32f2f',
  'market-down-wick':  '#d32f2f',
  'market-neutral':    '#7a8a9a',
  'market-volume':     'rgba(122,138,154,0.3)',

  'status-success':        '#00897b',
  'status-success-muted':  'rgba(0,137,123,0.1)',
  'status-warning':        '#f57c00',
  'status-warning-muted':  'rgba(245,124,0,0.1)',
  'status-danger':         '#d32f2f',
  'status-danger-muted':   'rgba(211,47,47,0.1)',
  'status-info':           '#2962ff',
  'status-info-muted':     'rgba(41,98,255,0.1)',
  'status-live':           '#00897b',

  'impact-high':     '#d32f2f',
  'impact-high-bg':  '#fde8e8',
  'impact-med':      '#f57c00',
  'impact-med-bg':   '#fff3e0',
  'impact-low':      '#2962ff',
  'impact-low-bg':   '#e8f0ff',

  'chart-bg':           '#ffffff',
  'chart-grid':         '#f0f2f5',
  'chart-axis':         '#7a8a9a',
  'chart-crosshair':    '#2962ff',
  'chart-crosshair-bg': '#ffffff',
  'chart-ema20':        'rgba(245,124,0,0.85)',
  'chart-ema50':        'rgba(41,98,255,0.85)',
  'chart-ema200':       'rgba(98,0,234,0.6)',
  'chart-vwap':         'rgba(0,137,123,0.7)',
  'chart-level-r':      'rgba(211,47,47,0.85)',
  'chart-level-s':      'rgba(0,137,123,0.85)',
  'chart-level-p':      'rgba(245,124,0,0.85)',

  'shadow-sm':    '0 1px 3px rgba(0,0,0,0.08)',
  'shadow-md':    '0 4px 12px rgba(0,0,0,0.1)',
  'shadow-lg':    '0 8px 24px rgba(0,0,0,0.12)',
  'shadow-panel': '0 2px 8px rgba(0,0,0,0.07)',
  'shadow-float': '0 16px 48px rgba(0,0,0,0.15)',
}

// ─── Theme registry ───────────────────────────────────────────────────────────
export const THEMES: Record<ThemeId, ThemeTokens> = {
  'dark-terminal': darkTerminal,
  'dark-pro':      darkPro,
  'dark-midnight': darkMidnight,
  'light-clean':   lightClean,
}

export const DEFAULT_THEME: ThemeId = 'dark-terminal'

export const THEME_LABELS: Record<ThemeId, string> = {
  'dark-terminal': 'Dark Terminal',
  'dark-pro':      'Dark Pro',
  'dark-midnight': 'Dark Midnight',
  'light-clean':   'Light Clean',
}

/** Check if a theme is dark */
export function isDarkTheme(id: ThemeId): boolean {
  return id !== 'light-clean'
}

/** Generate CSS custom properties string from a theme */
export function generateCSSVars(tokens: ThemeTokens): string {
  return Object.entries(tokens)
    .map(([key, value]) => `  --t-${key}: ${value};`)
    .join('\n')
}
