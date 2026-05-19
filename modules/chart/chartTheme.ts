import type { DeepPartial, ChartOptions, ColorType, CrosshairMode } from 'lightweight-charts'

// ─── Color palette ────────────────────────────────────────────────────────────
export const CHART_COLORS = {
  // Backgrounds
  bg:          '#0a0c0f',
  bgPanel:     '#0d1117',
  bgHeader:    '#0f1520',
  bgOverlay:   'rgba(10,12,15,0.85)',

  // Borders / grid
  border:      '#1e2530',
  grid:        '#131821',
  gridFine:    '#0f1520',

  // Candles
  upBody:      '#1a7a4a',
  upWick:      '#22c55e',
  upBorder:    '#22c55e',
  downBody:    '#7a1a1a',
  downWick:    '#ef4444',
  downBorder:  '#ef4444',

  // Area / line fills
  areaTop:     'rgba(34,197,94,0.18)',
  areaBottom:  'rgba(34,197,94,0.00)',
  lineUp:      '#22c55e',
  lineDn:      '#ef4444',

  // Volume
  volUp:       'rgba(34,197,94,0.25)',
  volDn:       'rgba(239,68,68,0.25)',
  volBorder:   'transparent',

  // Crosshair
  crosshair:   '#f0b429',
  crosshairLbl:'#0a0c0f',

  // Text
  textPrimary: '#c8cdd6',
  textMuted:   '#5a6373',
  textGold:    '#f0b429',

  // Levels / overlays
  levelBull:   'rgba(34,197,94,0.7)',
  levelBear:   'rgba(239,68,68,0.7)',
  levelGold:   'rgba(240,180,41,0.7)',
  sessionAsia:   'rgba(127,119,221,0.06)',
  sessionLondon: 'rgba(55,138,221,0.06)',
  sessionNY:     'rgba(34,197,94,0.06)',
} as const

// ─── Timeframe → seconds map ──────────────────────────────────────────────────
export const TIMEFRAME_SECONDS: Record<string, number> = {
  M1:  60,
  M5:  300,
  M15: 900,
  H1:  3600,
  H4:  14400,
  D1:  86400,
}

// ─── createChart options factory ──────────────────────────────────────────────
export function buildChartOptions(
  // We take ColorType and CrosshairMode as args to avoid importing lw-charts at module level
  ColorType: typeof import('lightweight-charts').ColorType,
  CrosshairMode: typeof import('lightweight-charts').CrosshairMode,
): DeepPartial<ChartOptions> {
  return {
    layout: {
      background: { type: ColorType.Solid, color: CHART_COLORS.bg },
      textColor:  CHART_COLORS.textMuted,
      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      fontSize:   10,
    },
    grid: {
      vertLines: { color: CHART_COLORS.grid, style: 0 },
      horzLines: { color: CHART_COLORS.grid, style: 0 },
    },
    crosshair: {
      mode: CrosshairMode.Normal,
      vertLine: {
        color:                CHART_COLORS.crosshair,
        width:                1,
        style:                3, // dashed
        labelBackgroundColor: CHART_COLORS.crosshair,
        labelVisible:         true,
      },
      horzLine: {
        color:                CHART_COLORS.crosshair,
        width:                1,
        style:                3,
        labelBackgroundColor: CHART_COLORS.crosshair,
        labelVisible:         true,
      },
    },
    rightPriceScale: {
      borderColor:     CHART_COLORS.border,
      textColor:       CHART_COLORS.textMuted,
      scaleMargins:    { top: 0.08, bottom: 0.22 }, // leave room for volume pane
      autoScale:       true,
      alignLabels:     true,
      entireTextOnly:  false,
    },
    leftPriceScale: {
      visible: false,
    },
    timeScale: {
      borderColor:      CHART_COLORS.border,
      timeVisible:      true,
      secondsVisible:   false,
      rightOffset:      8,
      barSpacing:       6,
      minBarSpacing:    2,
      fixLeftEdge:      false,
      fixRightEdge:     false,
      lockVisibleTimeRangeOnResize: true,
    },
    handleScroll: {
      mouseWheel:     true,
      pressedMouseMove: true,
      horzTouchDrag:  true,
      vertTouchDrag:  false,
    },
    handleScale: {
      axisPressedMouseMove: { time: true, price: true },
      mouseWheel:           true,
      pinch:                true,
    },
    localization: {
      locale: 'en-US',
      priceFormatter: (p: number) => p.toFixed(5),
    },
  }
}

// ─── Candlestick series options ───────────────────────────────────────────────
export const CANDLE_OPTIONS = {
  upColor:         CHART_COLORS.upBody,
  downColor:       CHART_COLORS.downBody,
  borderUpColor:   CHART_COLORS.upBorder,
  borderDownColor: CHART_COLORS.downBorder,
  wickUpColor:     CHART_COLORS.upWick,
  wickDownColor:   CHART_COLORS.downWick,
  borderVisible:   true,
  wickVisible:     true,
  priceScaleId:    'right',
} as const

// ─── Volume histogram options ─────────────────────────────────────────────────
export const VOLUME_OPTIONS = {
  color:       CHART_COLORS.volUp,
  priceFormat: { type: 'volume' as const },
  priceScaleId: 'volume',
  lastValueVisible: false,
  priceLineVisible: false,
} as const

// ─── Price line presets ───────────────────────────────────────────────────────
export const PRICE_LINE_PRESETS = {
  support: { color: CHART_COLORS.levelBull, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'S' },
  resist:  { color: CHART_COLORS.levelBear, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'R' },
  pivot:   { color: CHART_COLORS.levelGold, lineWidth: 1, lineStyle: 3, axisLabelVisible: true, title: 'P' },
} as const
