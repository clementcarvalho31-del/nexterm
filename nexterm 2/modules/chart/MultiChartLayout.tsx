'use client'
import { useState, useRef, useEffect, useCallback, memo } from 'react'
import type { IChartApi, Time } from 'lightweight-charts'
import { ChartPanel } from './ChartPanel'
import { CHART_COLORS } from './chartTheme'
import { cn } from '@/lib/utils'

// ─── Layout presets ───────────────────────────────────────────────────────────
type ChartLayoutMode = '1x1' | '2x1' | '2x2' | '3x1'

const LAYOUT_CONFIGS: Record<ChartLayoutMode, { label: string; symbols: string[] }> = {
  '1x1': { label: '1 Chart',  symbols: ['EUR/USD'] },
  '2x1': { label: '2 Charts', symbols: ['EUR/USD', 'GBP/USD'] },
  '2x2': { label: '4 Charts', symbols: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'DXY'] },
  '3x1': { label: '3 Charts', symbols: ['EUR/USD', 'GBP/USD', 'USD/JPY'] },
}

const GRID_STYLES: Record<ChartLayoutMode, React.CSSProperties> = {
  '1x1': { gridTemplateColumns: '1fr',       gridTemplateRows: '1fr' },
  '2x1': { gridTemplateColumns: '1fr 1fr',   gridTemplateRows: '1fr' },
  '2x2': { gridTemplateColumns: '1fr 1fr',   gridTemplateRows: '1fr 1fr' },
  '3x1': { gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr' },
}

// ─── Layout toggle buttons ────────────────────────────────────────────────────
interface LayoutButtonProps {
  mode:     ChartLayoutMode
  active:   boolean
  onClick:  () => void
}

const LayoutButton = memo(function LayoutButton({ mode, active, onClick }: LayoutButtonProps) {
  return (
    <button
      onClick={onClick}
      title={LAYOUT_CONFIGS[mode].label}
      style={{
        padding:      '2px 8px',
        fontSize:     9,
        fontFamily:   'inherit',
        border:       `0.5px solid ${active ? '#2a3444' : 'transparent'}`,
        borderRadius: 2,
        color:        active ? CHART_COLORS.textGold : CHART_COLORS.textMuted,
        background:   active ? '#131821' : 'transparent',
        cursor:       'pointer',
        transition:   'all 0.1s',
      }}
    >
      {LAYOUT_CONFIGS[mode].label}
    </button>
  )
})

// ─── Main component ───────────────────────────────────────────────────────────
interface MultiChartLayoutProps {
  className?: string
  defaultMode?: ChartLayoutMode
}

export function MultiChartLayout({ className, defaultMode = '2x1' }: MultiChartLayoutProps) {
  const [mode, setMode] = useState<ChartLayoutMode>(defaultMode)

  const config = LAYOUT_CONFIGS[mode]
  const gridStyle = GRID_STYLES[mode]

  return (
    <div
      className={cn('flex flex-col', className)}
      style={{ height: '100%', background: CHART_COLORS.bg, overflow: 'hidden' }}
    >
      {/* ── Toolbar ── */}
      <div style={{
        display:      'flex',
        alignItems:   'center',
        gap:          6,
        padding:      '4px 10px',
        flexShrink:   0,
        background:   CHART_COLORS.bgPanel,
        borderBottom: `0.5px solid ${CHART_COLORS.border}`,
      }}>
        <span style={{ fontSize: 9, color: CHART_COLORS.textMuted, letterSpacing: '1px', marginRight: 4 }}>
          LAYOUT
        </span>
        {(Object.keys(LAYOUT_CONFIGS) as ChartLayoutMode[]).map(m => (
          <LayoutButton key={m} mode={m} active={mode === m} onClick={() => setMode(m)} />
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {config.symbols.map(sym => (
            <span key={sym} style={{ fontSize: 9, color: CHART_COLORS.textMuted }}>{sym}</span>
          ))}
        </div>
      </div>

      {/* ── Chart grid ── */}
      <div
        style={{
          flex:      1,
          display:   'grid',
          gap:       2,
          minHeight: 0,
          ...gridStyle,
        }}
      >
        {config.symbols.map(symbol => (
          <div
            key={`${mode}-${symbol}`}
            style={{
              border:   `0.5px solid ${CHART_COLORS.border}`,
              overflow: 'hidden',
              minHeight: 0,
            }}
          >
            <ChartPanel symbol={symbol} className="h-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
