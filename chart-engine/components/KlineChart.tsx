'use client'
import { useEffect, useRef, useState, useCallback, memo, useId } from 'react'
import { useChartManager } from '../sync/ChartSyncManager'
import { KlineChartsEngine } from '../engines/KlineChartsEngine'

import { CHART_THEMES }      from '../themes/chartThemes'
import { generateHistory }   from '../engines/ChartDataService'
import type { Timeframe, ChartThemeId, IndicatorId, DrawingToolId, ChartTheme } from '../types'
import { INDICATOR_DEFAULTS } from '../types'

const SYMBOLS    = ['EUR/USD','GBP/USD','USD/JPY','AUD/USD','NZD/USD','USD/CAD','USD/CHF','DXY','GOLD','OIL']
const TIMEFRAMES = ['M1','M5','M15','M30','H1','H2','H4','D1','W1'] as Timeframe[]
const THEMES     = ['dark-terminal','dark-pro','light-clean','bloomberg'] as ChartThemeId[]

const KLINE_OVERLAYS: Array<{ id: string; name: string; label: string }> = [
  { id:'simpleAnnotation', name:'simpleAnnotation', label:'Text' },
  { id:'horizontalStraightLine', name:'horizontalStraightLine', label:'H-Line' },
  { id:'verticalStraightLine', name:'verticalStraightLine', label:'V-Line' },
  { id:'straightLine', name:'straightLine', label:'Line' },
  { id:'rayLine', name:'rayLine', label:'Ray' },
  { id:'segment', name:'segment', label:'Segment' },
  { id:'rect', name:'rect', label:'Rect' },
  { id:'parallelStraightLine', name:'parallelStraightLine', label:'Parallel' },
  { id:'circle', name:'circle', label:'Circle' },
  { id:'triangle', name:'triangle', label:'Triangle' },
  { id:'fibonacciLine', name:'fibonacciLine', label:'Fib' },
  { id:'fibonacciSegment', name:'fibonacciSegment', label:'Fib Seg' },
  { id:'fibonacciCircle', name:'fibonacciCircle', label:'Fib Circle' },
  { id:'fibonacciSpiral', name:'fibonacciSpiral', label:'Fib Spiral' },
  { id:'fibonacciSpeedResistanceFan', name:'fibonacciSpeedResistanceFan', label:'Fib Fan' },
  { id:'gannBox', name:'gannBox', label:'Gann Box' },
  { id:'xabcdPattern', name:'xabcdPattern', label:'XABCD' },
  { id:'abcdPattern', name:'abcdPattern', label:'ABCD' },
  { id:'threeBlackCrows', name:'threeBlackCrows', label:'3 Crows' },
  { id:'threeWhiteSoldiers', name:'threeWhiteSoldiers', label:'3 Soldiers' },
  { id:'longPosition', name:'priceLine', label:'Long' },
  { id:'shortPosition', name:'priceLine', label:'Short' },
]

interface KlineChartProps {
  instanceId: string
  className?: string
  onFullscreen?: () => void
}

export const KlineChart = memo(function KlineChart({ instanceId, className, onFullscreen }: KlineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef    = useRef<KlineChartsEngine | null>(null)
  const feedRef      = useRef<{ start:()=>void; stop:()=>void; setSymbol:(s:string)=>void; setTimeframe:(tf:any)=>void } | null>(null)

  const inst           = useChartManager(s => s.instances[instanceId])
  const updateSymbol   = useChartManager(s => s.updateSymbol)
  const updateTimeframe= useChartManager(s => s.updateTimeframe)
  const updateTheme    = useChartManager(s => s.updateTheme)
  const addIndicator   = useChartManager(s => s.addIndicator)
  const removeIndicator= useChartManager(s => s.removeIndicator)
  const toggleVolume   = useChartManager(s => s.toggleVolume)

  const [showSymbolSearch, setShowSymbolSearch] = useState(false)
  const [symQuery, setSymQuery]     = useState('')
  const [showIndicators, setShowIndicators] = useState(false)
  const [showTheme, setShowTheme]   = useState(false)
  const [showDrawTools, setShowDrawTools] = useState(false)
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null)
  const [ticks, setTicks] = useState<Record<string, number>>({})

  const symbol    = inst?.symbol    ?? 'EUR/USD'
  const timeframe = inst?.timeframe ?? 'M15'
  const themeId   = inst?.themeId   ?? 'dark-terminal'
  const theme     = CHART_THEMES[themeId]

  // ── Init engine ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || !inst) return
    let mounted = true

    const engine = new KlineChartsEngine(inst as any)
    engineRef.current = engine

    engine.init(containerRef.current, inst as any).then(() => {
      if (!mounted) return
      const history = generateHistory(symbol, timeframe, 350)
      engine.applyData(history)
      engine.scrollToLatest()

      // Start realtime feed

      import('../engines/ChartDataService').then(({ ChartDataFeed }) => {
      const feed = new ChartDataFeed(symbol, timeframe, (bar: any) => {
        engine.updateBar(bar)
        setTicks(prev => ({ ...prev, [symbol]: bar.close }))
      })
      feed.start()
      feedRef.current = feed
      }) // end import
    })

    return () => {
      mounted = false
      feedRef.current?.stop()
      engine.dispose()
      engineRef.current = null
    }
  }, [instanceId])  // Only on mount

  // ── Symbol change ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!engineRef.current) return
    engineRef.current.setSymbol(symbol)
    feedRef.current?.setSymbol(symbol)
    const history = generateHistory(symbol, timeframe, 350)
    engineRef.current.applyData(history)
    engineRef.current.scrollToLatest()
  }, [symbol])

  // ── Timeframe change ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!engineRef.current) return
    engineRef.current.setTimeframe(timeframe)
    feedRef.current?.setTimeframe(timeframe)
    const history = generateHistory(symbol, timeframe, 350)
    engineRef.current.applyData(history)
    engineRef.current.scrollToLatest()
  }, [timeframe])

  // ── Theme change ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!engineRef.current) return
    engineRef.current.setTheme(theme)
  }, [themeId])

  const handleSymbolSelect = useCallback((sym: string) => {
    updateSymbol(instanceId, sym)
    setShowSymbolSearch(false)
    setSymQuery('')
  }, [instanceId, updateSymbol])

  const handleAddIndicator = useCallback(async (type: IndicatorId) => {
    const defaults = INDICATOR_DEFAULTS[type]
    const id = `ind_${Date.now()}`
    const config = { ...defaults, id }
    addIndicator(instanceId, config)
    engineRef.current?.addIndicator(config)
    setShowIndicators(false)
  }, [instanceId, addIndicator])

  const handleRemoveIndicator = useCallback((indId: string) => {
    removeIndicator(instanceId, indId)
    engineRef.current?.removeIndicator(indId)
  }, [instanceId, removeIndicator])

  const handleOverlay = useCallback(async (overlayName: string) => {
    setActiveOverlay(overlayName)
    setShowDrawTools(false)
    const engine = engineRef.current as any
    engine?.addOverlay?.(overlayName)
  }, [])

  const handleClearOverlays = useCallback(() => {
    setActiveOverlay(null)
    const engine = engineRef.current as any
    engine?.removeAllOverlays?.()
  }, [])

  const dec = symbol.includes('JPY') || symbol === 'DXY' ? 3 : symbol === 'GOLD' ? 2 : 5
  const livePrice = ticks[symbol]
  const filteredSymbols = symQuery
    ? SYMBOLS.filter(s => s.toLowerCase().includes(symQuery.toLowerCase()))
    : SYMBOLS

  const C = theme

  return (
    <div
      className={className}
      style={{ display:'flex', flexDirection:'column', height:'100%', background:C.bg, overflow:'hidden', fontFamily:"'Courier New',monospace", fontSize:10 }}
      onClick={() => { setShowSymbolSearch(false); setShowIndicators(false); setShowTheme(false); setShowDrawTools(false) }}
    >
      {/* ── Toolbar ── */}
      <div
        style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 8px', flexShrink:0, background:C.bgSecondary, borderBottom:`0.5px solid ${C.borderColor}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Symbol button */}
        <div style={{ position:'relative' }}>
          <button
            onClick={() => setShowSymbolSearch(v => !v)}
            style={toolbarBtn(C, true)}
          >
            {symbol} ▾
          </button>
          {showSymbolSearch && (
            <div style={{ position:'absolute', top:'110%', left:0, background:C.bgSecondary, border:`1px solid ${C.borderColor}`, borderRadius:3, zIndex:100, minWidth:150, boxShadow:'0 8px 32px rgba(0,0,0,0.7)' }}>
              <input
                autoFocus value={symQuery}
                onChange={e => setSymQuery(e.target.value)}
                placeholder="Search…"
                style={{ width:'100%', background:C.bg, border:'none', borderBottom:`0.5px solid ${C.borderColor}`, color:C.text, fontSize:10, padding:'5px 8px', outline:'none', fontFamily:'inherit' }}
              />
              {filteredSymbols.map(s => (
                <button key={s} onClick={() => handleSymbolSelect(s)}
                  style={{ display:'block', width:'100%', padding:'4px 10px', background:'transparent', border:'none', color:s===symbol ? C.crosshair : C.text, fontSize:10, cursor:'pointer', textAlign:'left', fontFamily:'inherit' }}
                  onMouseEnter={e => e.currentTarget.style.background=C.bg}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >{s}</button>
              ))}
            </div>
          )}
        </div>

        {/* Live price */}
        {livePrice && (
          <span style={{ fontSize:14, fontWeight:700, color:C.text, fontVariantNumeric:'tabular-nums', marginLeft:4 }}>
            {livePrice.toFixed(dec)}
          </span>
        )}

        <Divider color={C.borderColor} />

        {/* Timeframes */}
        {TIMEFRAMES.map(tf => (
          <button key={tf}
            onClick={() => updateTimeframe(instanceId, tf)}
            style={toolbarBtn(C, tf === timeframe)}
          >{tf}</button>
        ))}

        <Divider color={C.borderColor} />

        {/* Drawing tools */}
        <div style={{ position:'relative' }}>
          <button
            onClick={e => { e.stopPropagation(); setShowDrawTools(v => !v); setShowIndicators(false); setShowTheme(false) }}
            style={toolbarBtn(C, showDrawTools || !!activeOverlay)}
            title="Drawing tools"
          >
            ✏️ Draw{activeOverlay ? ' ●' : ''}
          </button>
          {activeOverlay && (
            <button onClick={handleClearOverlays}
              style={{ ...toolbarBtn(C, false), color:C.downColor, marginLeft:1 }}
              title="Clear drawings">🗑</button>
          )}
          {showDrawTools && (
            <div style={{ position:'absolute', top:'110%', left:0, background:C.bgSecondary, border:`1px solid ${C.borderColor}`, borderRadius:3, zIndex:100, padding:6, minWidth:200, boxShadow:'0 8px 32px rgba(0,0,0,0.7)', display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
              {KLINE_OVERLAYS.map(o => (
                <button key={o.id} onClick={() => handleOverlay(o.name)}
                  style={{ padding:'3px 6px', background: activeOverlay===o.name ? `${C.crosshair}20` : 'transparent', border:`0.5px solid ${activeOverlay===o.name ? C.crosshair : 'transparent'}`, color: activeOverlay===o.name ? C.crosshair : C.textMuted, fontSize:9, cursor:'pointer', borderRadius:2, fontFamily:'inherit', textAlign:'left' }}
                  onMouseEnter={e => e.currentTarget.style.background=C.bg}
                  onMouseLeave={e => e.currentTarget.style.background=activeOverlay===o.name?`${C.crosshair}20`:'transparent'}
                >{o.label}</button>
              ))}
            </div>
          )}
        </div>

        {/* Indicators */}
        <div style={{ position:'relative' }}>
          <button
            onClick={e => { e.stopPropagation(); setShowIndicators(v => !v); setShowDrawTools(false); setShowTheme(false) }}
            style={toolbarBtn(C, showIndicators || (inst?.indicators?.length ?? 0) > 0)}
            title="Indicators"
          >
            ƒ Indicators{inst?.indicators?.length ? ` (${inst.indicators.length})` : ''}
          </button>
          {showIndicators && (
            <div style={{ position:'absolute', top:'110%', left:0, background:C.bgSecondary, border:`1px solid ${C.borderColor}`, borderRadius:3, zIndex:100, padding:8, minWidth:220, boxShadow:'0 8px 32px rgba(0,0,0,0.7)' }}>
              <div style={{ fontSize:8, color:C.textMuted, letterSpacing:'1px', marginBottom:6 }}>ADD INDICATOR</div>
              {(['EMA','SMA','BOLL','RSI','MACD','STOCH','ATR','VOL'] as IndicatorId[]).map(type => (
                <button key={type} onClick={() => handleAddIndicator(type)}
                  style={{ display:'block', width:'100%', padding:'4px 8px', background:'transparent', border:'none', color:C.text, fontSize:10, cursor:'pointer', textAlign:'left', fontFamily:'inherit', borderRadius:2 }}
                  onMouseEnter={e => e.currentTarget.style.background=C.bg}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >{type}</button>
              ))}
              {(inst?.indicators?.length ?? 0) > 0 && (
                <>
                  <div style={{ borderTop:`0.5px solid ${C.borderColor}`, margin:'6px 0', paddingTop:4, fontSize:8, color:C.textMuted, letterSpacing:'1px' }}>ACTIVE</div>
                  {inst?.indicators.map(ind => (
                    <div key={ind.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'2px 4px' }}>
                      <span style={{ fontSize:10, color:C.text }}>{ind.type}</span>
                      <button onClick={() => handleRemoveIndicator(ind.id)}
                        style={{ background:'none', border:'none', color:C.downColor, cursor:'pointer', fontSize:10, fontFamily:'inherit' }}>✕</button>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Theme */}
        <div style={{ position:'relative' }}>
          <button
            onClick={e => { e.stopPropagation(); setShowTheme(v => !v); setShowIndicators(false); setShowDrawTools(false) }}
            style={toolbarBtn(C, showTheme)}
            title="Theme"
          >🎨</button>
          {showTheme && (
            <div style={{ position:'absolute', top:'110%', right:0, background:C.bgSecondary, border:`1px solid ${C.borderColor}`, borderRadius:3, zIndex:100, padding:8, minWidth:160, boxShadow:'0 8px 32px rgba(0,0,0,0.7)' }}>
              {THEMES.map(tid => (
                <button key={tid} onClick={() => { updateTheme(instanceId, tid); setShowTheme(false) }}
                  style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'5px 8px', background: tid===themeId ? `${C.crosshair}20` : 'transparent', border:'none', color: tid===themeId ? C.crosshair : C.text, fontSize:10, cursor:'pointer', fontFamily:'inherit', borderRadius:2 }}
                  onMouseEnter={e => e.currentTarget.style.background=C.bg}
                  onMouseLeave={e => e.currentTarget.style.background=tid===themeId?`${C.crosshair}20`:'transparent'}
                >
                  <span style={{ width:12, height:12, borderRadius:'50%', background:CHART_THEMES[tid].upColor, display:'inline-block' }} />
                  {CHART_THEMES[tid].name}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => toggleVolume(instanceId)} style={toolbarBtn(C, inst?.showVolume)} title="Volume">VOL</button>

        <div style={{ flex:1 }} />

        {/* Screenshot */}
        <button
          onClick={() => {
            const url = engineRef.current?.getScreenshot()
            if (url) { const a = document.createElement('a'); a.href=url; a.download=`${symbol}-${timeframe}.png`; a.click() }
          }}
          style={toolbarBtn(C, false)} title="Download screenshot"
        >📷</button>

        {onFullscreen && (
          <button onClick={onFullscreen} style={toolbarBtn(C, false)} title="Fullscreen">⛶</button>
        )}
      </div>

      {/* ── Chart container ── */}
      <div ref={containerRef} style={{ flex:1, minHeight:0, overflow:'hidden', background:C.bg }} />
    </div>
  )
})

function Divider({ color }: { color: string }) {
  return <div style={{ width:1, height:16, background:color, margin:'0 2px', flexShrink:0 }} />
}

function toolbarBtn(theme: ChartTheme, active?: boolean): React.CSSProperties {
  return {
    padding: '2px 6px', fontSize: 9, fontFamily: "'Courier New',monospace", cursor: 'pointer',
    background: active ? `${theme.crosshair}18` : 'transparent',
    border: `0.5px solid ${active ? theme.crosshair : 'transparent'}`,
    color: active ? theme.crosshair : theme.textMuted,
    borderRadius: 2, transition: 'all .1s',
    whiteSpace: 'nowrap' as const,
  }
}
