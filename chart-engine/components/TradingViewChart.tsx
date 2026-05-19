'use client'
import { useEffect, useRef, useState, useCallback, memo } from 'react'
import { useChartManager } from '../sync/ChartSyncManager'
import { TradingViewBridge, symbolToTV, TIMEFRAME_TO_TV } from '../adapters/TradingViewBridge'
import { CHART_THEMES }  from '../themes/chartThemes'
import type { Timeframe, ChartThemeId } from '../types'

const SYMBOLS    = ['EUR/USD','GBP/USD','USD/JPY','AUD/USD','NZD/USD','USD/CAD','USD/CHF','DXY','GOLD']
const TIMEFRAMES = ['M1','M5','M15','M30','H1','H2','H4','D1','W1'] as Timeframe[]

interface TradingViewChartProps {
  instanceId: string
  className?: string
  onFullscreen?: () => void
}

let tvCounter = 0

export const TradingViewChart = memo(function TradingViewChart({
  instanceId, className, onFullscreen,
}: TradingViewChartProps) {
  const containerId = useRef(`tv_${instanceId.replace(/[^a-z0-9]/gi, '_')}`).current
  const bridgeRef   = useRef<TradingViewBridge | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const inst          = useChartManager(s => s.instances[instanceId])
  const updateSymbol  = useChartManager(s => s.updateSymbol)
  const updateTF      = useChartManager(s => s.updateTimeframe)
  const updateTheme   = useChartManager(s => s.updateTheme)
  const toggleLinked  = useChartManager(s => s.toggleLinked)

  const [showSymbolSearch, setShowSymbolSearch] = useState(false)
  const [symQuery, setSymQuery] = useState('')

  const symbol    = inst?.symbol    ?? 'EUR/USD'
  const timeframe = inst?.timeframe ?? 'M15'
  const themeId   = inst?.themeId   ?? 'dark-terminal'
  const theme     = CHART_THEMES[themeId]

  // Mount TradingView widget
  useEffect(() => {
    if (!inst) return
    setLoading(true)
    setError(null)

    const bridge = new TradingViewBridge(containerId)
    bridgeRef.current = bridge

    bridge.mount(inst as any)
      .then(() => setLoading(false))
      .catch(err => {
        setError('TradingView unavailable — check your internet connection.')
        setLoading(false)
      })

    return () => { bridge.destroy() }
  }, [instanceId])  // Mount once per instance

  // Remount on symbol/TF/theme change (TradingView widget needs full remount)
  useEffect(() => {
    if (!inst || loading) return
    const bridge = bridgeRef.current
    if (!bridge) return
    setLoading(true)
    bridge.mount(inst as any).then(() => setLoading(false)).catch(() => setLoading(false))
  }, [symbol, timeframe, themeId])

  const handleSymbolSelect = useCallback((sym: string) => {
    updateSymbol(instanceId, sym)
    setShowSymbolSearch(false)
    setSymQuery('')
  }, [instanceId, updateSymbol])

  const filteredSymbols = symQuery
    ? SYMBOLS.filter(s => s.toLowerCase().includes(symQuery.toLowerCase()))
    : SYMBOLS

  const C = theme

  return (
    <div
      className={className}
      style={{ display:'flex', flexDirection:'column', height:'100%', background:C.bg, overflow:'hidden', fontFamily:"'Courier New',monospace" }}
    >
      {/* ── Mini toolbar (above TradingView) ── */}
      <div style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 8px', flexShrink:0, background:C.bgSecondary, borderBottom:`0.5px solid ${C.borderColor}` }}>
        {/* Engine badge */}
        <span style={{ fontSize:8, background:'#1a2233', border:'0.5px solid #2a3a50', color:'#4a8acd', padding:'1px 5px', borderRadius:2, letterSpacing:'0.5px', flexShrink:0 }}>
          TV
        </span>

        {/* Quick symbol picker */}
        <div style={{ position:'relative' }}>
          <button
            onClick={() => setShowSymbolSearch(v => !v)}
            style={tvBtn(C, true)}
          >{symbol} ▾</button>
          {showSymbolSearch && (
            <div style={{ position:'absolute', top:'110%', left:0, background:C.bgSecondary, border:`1px solid ${C.borderColor}`, borderRadius:3, zIndex:200, minWidth:140, boxShadow:'0 8px 32px rgba(0,0,0,0.8)' }}
              onClick={e => e.stopPropagation()}>
              <input autoFocus value={symQuery} onChange={e => setSymQuery(e.target.value)}
                placeholder="Search…"
                style={{ width:'100%', background:C.bg, border:'none', borderBottom:`0.5px solid ${C.borderColor}`, color:C.text, fontSize:10, padding:'5px 8px', outline:'none', fontFamily:'inherit' }} />
              {filteredSymbols.map(s => (
                <button key={s} onClick={() => handleSymbolSelect(s)}
                  style={{ display:'block', width:'100%', padding:'4px 10px', background:'transparent', border:'none', color:s===symbol?C.crosshair:C.text, fontSize:10, cursor:'pointer', textAlign:'left', fontFamily:'inherit' }}
                  onMouseEnter={e => e.currentTarget.style.background=C.bg}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >{s}</button>
              ))}
            </div>
          )}
        </div>

        {TIMEFRAMES.map(tf => (
          <button key={tf} onClick={() => updateTF(instanceId, tf)} style={tvBtn(C, tf===timeframe)}>{tf}</button>
        ))}

        <div style={{ flex:1 }} />

        <button onClick={() => toggleLinked(instanceId)} style={tvBtn(C, inst?.linked)} title="Sync with other charts">
          {inst?.linked ? '🔗' : '🔓'}
        </button>

        {/* Theme */}
        {(['dark-terminal','dark-pro','light-clean','bloomberg'] as ChartThemeId[]).map(tid => (
          <button key={tid} onClick={() => updateTheme(instanceId, tid)}
            style={{ ...tvBtn(C, tid===themeId), padding:'1px 4px' }}
            title={CHART_THEMES[tid].name}
          >
            <span style={{ width:10, height:10, borderRadius:'50%', background:CHART_THEMES[tid].upColor, display:'inline-block' }} />
          </button>
        ))}

        {onFullscreen && <button onClick={onFullscreen} style={tvBtn(C, false)} title="Fullscreen">⛶</button>}
      </div>

      {/* ── TradingView widget container ── */}
      <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
        {loading && (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:C.bg, zIndex:10, flexDirection:'column', gap:8 }}>
            <div style={{ fontSize:9, color:C.textMuted, letterSpacing:'1px' }}>LOADING TRADINGVIEW…</div>
            <div style={{ display:'flex', gap:3 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:C.crosshair, opacity:0.6, animation:`pulse 1.4s ease-in-out ${i*0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        {error && (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:C.bg, zIndex:10, flexDirection:'column', gap:8 }}>
            <div style={{ fontSize:10, color:C.downColor }}>{error}</div>
            <button onClick={() => { setError(null); setLoading(true); bridgeRef.current?.mount(inst as any).then(() => setLoading(false)).catch(() => { setError('Retry failed'); setLoading(false) }) }}
              style={{ fontSize:9, color:C.crosshair, background:'transparent', border:`0.5px solid ${C.crosshair}`, padding:'4px 12px', borderRadius:2, cursor:'pointer', fontFamily:'inherit' }}>
              Retry
            </button>
          </div>
        )}
        <div id={containerId} style={{ width:'100%', height:'100%' }} />
      </div>
    </div>
  )
})

function tvBtn(theme: import('../types').ChartTheme, active?: boolean): React.CSSProperties {
  return {
    padding:'2px 6px', fontSize:9, fontFamily:"'Courier New',monospace", cursor:'pointer',
    background: active ? `${theme.crosshair}18` : 'transparent',
    border: `0.5px solid ${active ? theme.crosshair : 'transparent'}`,
    color: active ? theme.crosshair : theme.textMuted,
    borderRadius:2, transition:'all .1s', whiteSpace:'nowrap' as const, flexShrink:0,
  }
}
