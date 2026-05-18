'use client'
import { useState, memo, useCallback } from 'react'
import { useChart } from './useChart'
import type { Timeframe } from '@/types'
import { getSymbolDecimals } from './chartDataAdapter'
import { CHART_COLORS } from './chartTheme'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────
const TIMEFRAMES: Timeframe[] = ['M1', 'M5', 'M15', 'H1', 'H4', 'D1']

const SYMBOLS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'DXY'] as const
type SupportedSymbol = typeof SYMBOLS[number]

// ─── Sub-components ───────────────────────────────────────────────────────────
interface TimeframeSelectorProps {
  active:   Timeframe
  onChange: (tf: Timeframe) => void
}

const TimeframeSelector = memo(function TimeframeSelector({ active, onChange }: TimeframeSelectorProps) {
  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {TIMEFRAMES.map(tf => (
        <button
          key={tf}
          onClick={() => onChange(tf)}
          style={{
            padding:    '2px 7px',
            fontSize:   9,
            fontFamily: 'inherit',
            border:     `0.5px solid ${active === tf ? '#2a3444' : 'transparent'}`,
            borderRadius: 2,
            color:      active === tf ? CHART_COLORS.textGold : CHART_COLORS.textMuted,
            background: active === tf ? '#131821' : 'transparent',
            cursor:     'pointer',
            transition: 'all 0.1s',
          }}
        >
          {tf}
        </button>
      ))}
    </div>
  )
})

interface IndicatorToggleProps {
  label:   string
  active:  boolean
  color?:  string
  onClick: () => void
}

const IndicatorToggle = memo(function IndicatorToggle({ label, active, color = '#8a9ab0', onClick }: IndicatorToggleProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding:    '1px 6px',
        fontSize:   8,
        fontFamily: 'inherit',
        border:     `0.5px solid ${active ? color : '#1e2530'}`,
        borderRadius: 2,
        color:      active ? color : '#3d4a5a',
        background: active ? `${color}15` : 'transparent',
        cursor:     'pointer',
        transition: 'all 0.12s',
      }}
    >
      {label}
    </button>
  )
})

interface PriceDisplayProps {
  symbol:    string
  price:     number | null
  change:    number | null
  isLoading: boolean
}

const PriceDisplay = memo(function PriceDisplay({ symbol, price, change, isLoading }: PriceDisplayProps) {
  const dec    = getSymbolDecimals(symbol)
  const isUp   = (change ?? 0) >= 0
  const color  = isUp ? CHART_COLORS.upWick : CHART_COLORS.downWick

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: CHART_COLORS.textPrimary }}>{symbol}</span>
        <span style={{ fontSize: 10, color: CHART_COLORS.textMuted }}>Loading…</span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: CHART_COLORS.textPrimary, letterSpacing: '0.5px' }}>
        {symbol}
      </span>
      {price !== null && (
        <>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#f0f6ff', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px' }}>
            {price.toFixed(dec)}
          </span>
          {change !== null && (
            <span style={{ fontSize: 10, color, fontVariantNumeric: 'tabular-nums' }}>
              {isUp ? '+' : ''}{change.toFixed(2)}%
            </span>
          )}
        </>
      )}
    </div>
  )
})

// ─── Main ChartPanel ──────────────────────────────────────────────────────────
interface ChartPanelProps {
  symbol?:   SupportedSymbol | string
  className?: string
}

export const ChartPanel = memo(function ChartPanel({
  symbol    = 'EUR/USD',
  className,
}: ChartPanelProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('M15')
  const [showVolume,   setShowVolume]   = useState(true)
  const [showEMA20,    setShowEMA20]    = useState(true)
  const [showEMA50,    setShowEMA50]    = useState(true)
  const [showLevels,   setShowLevels]   = useState(true)
  const [showSessions, setShowSessions] = useState(false)

  const { containerRef, lastPrice, lastChange, isLoading } = useChart({
    symbol,
    timeframe,
    showVolume,
    showEMA20,
    showEMA50,
    showLevels,
    showSessions,
  })

  const handleTimeframeChange = useCallback((tf: Timeframe) => {
    setTimeframe(tf)
  }, [])

  return (
    <div
      className={cn('flex flex-col', className)}
      style={{ height: '100%', background: CHART_COLORS.bg, overflow: 'hidden' }}
    >
      {/* ── Header ── */}
      <div style={{
        display:       'flex',
        alignItems:    'center',
        gap:           10,
        padding:       '5px 10px',
        flexShrink:    0,
        background:    CHART_COLORS.bgPanel,
        borderBottom:  `0.5px solid ${CHART_COLORS.border}`,
      }}>
        {/* Price info */}
        <PriceDisplay symbol={symbol} price={lastPrice} change={lastChange} isLoading={isLoading} />

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Indicator toggles */}
          <div style={{ display: 'flex', gap: 3 }}>
            <IndicatorToggle label="VOL"  active={showVolume}   color="#8a9ab0" onClick={() => setShowVolume(v => !v)} />
            <IndicatorToggle label="EMA20" active={showEMA20}   color="#f0b429" onClick={() => setShowEMA20(v => !v)} />
            <IndicatorToggle label="EMA50" active={showEMA50}   color="#378add" onClick={() => setShowEMA50(v => !v)} />
            <IndicatorToggle label="LVL"  active={showLevels}   color="#22c55e" onClick={() => setShowLevels(v => !v)} />
          </div>

          {/* Timeframe selector */}
          <TimeframeSelector active={timeframe} onChange={handleTimeframeChange} />
        </div>
      </div>

      {/* ── Chart container ── */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {isLoading && (
          <div style={{
            position:   'absolute',
            inset:      0,
            display:    'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: CHART_COLORS.bg,
            zIndex:     10,
          }}>
            <ChartLoader />
          </div>
        )}
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  )
})

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function ChartLoader() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {/* Animated bar skeleton */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 60 }}>
        {[40, 65, 45, 80, 55, 70, 50, 90, 60, 75, 55, 85].map((h, i) => (
          <div
            key={i}
            style={{
              width:        5,
              height:       `${h}%`,
              background:   i % 2 === 0 ? '#1a7a4a' : '#7a1a1a',
              borderRadius: 1,
              opacity:      0.4 + (i / 20),
              animation:    `pulse2 ${1.2 + i * 0.08}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 9, color: CHART_COLORS.textMuted, letterSpacing: '1px' }}>
        LOADING CHART…
      </span>
    </div>
  )
}
