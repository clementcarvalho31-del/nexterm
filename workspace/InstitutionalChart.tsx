'use client'
import { useEffect, useRef, useState, useCallback, memo } from 'react'
import { useWorkspaceManager } from '@/workspace/manager'
import type { ChartConfig } from '@/workspace/types'
import { generateHistory } from '@/modules/chart/chartDataAdapter'
import { useTerminalStore } from '@/store/terminal'

// ─── Constants ────────────────────────────────────────────────────────────────
const SYMBOLS   = ['EUR/USD','GBP/USD','USD/JPY','AUD/USD','NZD/USD','USD/CAD','USD/CHF','DXY','GOLD']
const TIMEFRAMES = ['M1','M5','M15','H1','H4','D1','W1']
const C = {
  bg:'#0a0c0f', bg2:'#0d1117', bg3:'#0f1520', bg4:'#131821',
  border:'#1e2530', border2:'#2a3444',
  text:'#c8cdd6', text2:'#8a9ab0', text3:'#5a6373',
  gold:'#f0b429', green:'#22c55e', red:'#ef4444', blue:'#378add',
  upBody:'#1a7a4a', dnBody:'#7a1a1a', upWick:'#22c55e', dnWick:'#ef4444',
} as const

// ─── Mini toolbar button ──────────────────────────────────────────────────────
function TBtn({ label, active, color, onClick, title }: {
  label: string; active?: boolean; color?: string; onClick: () => void; title?: string
}) {
  return (
    <button title={title} onClick={onClick} style={{
      padding:'2px 6px', fontSize:9, fontFamily:'inherit', cursor:'pointer',
      background: active ? (color ? `${color}20` : C.bg4) : 'transparent',
      border: `0.5px solid ${active ? (color ?? C.border2) : 'transparent'}`,
      color: active ? (color ?? C.gold) : C.text3,
      borderRadius:2, transition:'all .1s',
    }}
    onMouseEnter={e => { if(!active){ e.currentTarget.style.color=C.text2 }}}
    onMouseLeave={e => { if(!active){ e.currentTarget.style.color=C.text3 }}}
    >{label}</button>
  )
}

// ─── Drawing tools ────────────────────────────────────────────────────────────
type DrawTool = 'none' | 'trendline' | 'hline' | 'fibonacci' | 'rect' | 'text'
const DRAW_TOOLS: { id: DrawTool; label: string; title: string }[] = [
  { id:'trendline', label:'╱',  title:'Trendline' },
  { id:'hline',     label:'─',  title:'Horizontal Line' },
  { id:'fibonacci', label:'≋',  title:'Fibonacci Retracement' },
  { id:'rect',      label:'▭',  title:'Rectangle' },
  { id:'text',      label:'T',  title:'Text Note' },
]

interface DrawObject {
  id: string
  tool: DrawTool
  color: string
  x1: number; y1: number
  x2?: number; y2?: number
}

// ─── Main chart component ─────────────────────────────────────────────────────
interface InstitutionalChartProps {
  instanceId: string
  className?: string
  onFullscreen?: () => void
}

export const InstitutionalChart = memo(function InstitutionalChart({
  instanceId, className, onFullscreen,
}: InstitutionalChartProps) {
  const getChartConfig     = useWorkspaceManager(s => s.getChartConfig)
  const updateChartConfig  = useWorkspaceManager(s => s.updateChartConfig)
  const config             = getChartConfig(instanceId)

  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const volRef      = useRef<HTMLCanvasElement>(null)
  const containerRef= useRef<HTMLDivElement>(null)
  const historyRef  = useRef<ReturnType<typeof generateHistory>['candles']>([])
  const drawObjects = useRef<DrawObject[]>([])
  const isDragging  = useRef(false)
  const dragStart   = useRef({ x:0, y:0 })
  const offsetRef   = useRef(0)
  const scaleRef    = useRef(1)
  const animFrame   = useRef(0)

  const [activeTool, setActiveTool] = useState<DrawTool>('none')
  const [isDrawing, setIsDrawing]   = useState(false)
  const [drawStart, setDrawStart]   = useState<{x:number;y:number}|null>(null)
  const [crosshair, setCrosshair]   = useState<{x:number;y:number}|null>(null)
  const [showIndicators, setShowIndicators] = useState(false)
  const [showSymbolSearch, setShowSymbolSearch] = useState(false)
  const [symSearch, setSymSearch] = useState('')

  const ticks = useTerminalStore(s => s.ticks)

  // ── Generate / regenerate history when symbol or TF changes ──────────────
  useEffect(() => {
    const { candles } = generateHistory(config.symbol, config.timeframe as any, 300)
    historyRef.current = candles
    offsetRef.current = 0
    scaleRef.current = 1
    draw()
  }, [config.symbol, config.timeframe])

  // ── Live tick update ──────────────────────────────────────────────────────
  useEffect(() => {
    const tick = ticks[config.symbol]
    if (!tick || !historyRef.current.length) return
    const hist = historyRef.current
    const last = hist[hist.length - 1]
    last.close = tick.price
    last.high  = Math.max(last.high, tick.price)
    last.low   = Math.min(last.low,  tick.price)
    draw()
  }, [ticks, config.symbol])

  // ── Core draw function ────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const cv = canvasRef.current
    const vv = volRef.current
    if (!cv || !vv) return

    const W = cv.offsetWidth, H = cv.offsetHeight
    const VH = vv.offsetHeight
    if (!W || !H) return
    cv.width = W; cv.height = H; vv.width = W; vv.height = VH

    const ctx  = cv.getContext('2d')!
    const vtx  = vv.getContext('2d')!
    const bars = historyRef.current
    if (!bars.length) return

    const dec = config.symbol.includes('JPY') || config.symbol === 'DXY' ? 3
              : config.symbol === 'GOLD' ? 1 : 5

    const barWidth = Math.max(2, 7 * scaleRef.current)
    const gap      = Math.max(1, barWidth * 0.15)
    const barStep  = barWidth + gap
    const maxVisible = Math.floor((W - 60) / barStep)
    const startIdx = Math.max(0, bars.length - maxVisible - Math.floor(offsetRef.current))
    const vis = bars.slice(startIdx, startIdx + maxVisible)
    if (!vis.length) return

    const mn = Math.min(...vis.map(b => b.low))
    const mx = Math.max(...vis.map(b => b.high))
    const rng = mx - mn || 0.001
    const pad = 10
    const toY = (v: number) => H - pad - ((v - mn) / rng) * (H - pad * 2)
    const maxVol = Math.max(...vis.map(b => b.volume ?? 1000))

    // Background
    ctx.fillStyle = C.bg; ctx.fillRect(0,0,W,H)
    vtx.fillStyle = C.bg; vtx.fillRect(0,0,W,VH)

    // Grid
    const gridFracs: number[] = [0.2,0.4,0.6,0.8]
    gridFracs.forEach((f: number) => {
      const y = pad + f*(H-pad*2)
      const pv = mx - f*rng
      ctx.strokeStyle = C.bg4; ctx.lineWidth = .5
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke()
      ctx.fillStyle = C.text3; ctx.font = '8px Courier New'; ctx.textAlign = 'right'
      ctx.fillText(pv.toFixed(dec), W-3, y-2)
    })

    // EMA helper
    function drawEMA(period: number, color: string) {
      const k = 2/(period+1)
      let ema = vis[0].close
      ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.beginPath()
      vis.forEach((b,i) => {
        ema = i === 0 ? b.close : b.close*k + ema*(1-k)
        const x = pad + i*barStep + barWidth/2
        i === 0 ? ctx.moveTo(x, toY(ema)) : ctx.lineTo(x, toY(ema))
      })
      ctx.stroke()
    }

    if (config.showEMA20)  drawEMA(20,  'rgba(240,180,41,.7)')
    if (config.showEMA50)  drawEMA(50,  'rgba(55,138,221,.7)')
    if (config.showEMA200) drawEMA(200, 'rgba(127,119,221,.5)')

    // Bollinger
    if (config.showBB && vis.length >= 20) {
      const period = 20
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = .8
      const upper: number[] = [], lower: number[] = []
      vis.forEach((_, i) => {
        if (i < period-1) { upper.push(0); lower.push(0); return }
        const sl = vis.slice(i-period+1,i+1)
        const mean = sl.reduce((s,c)=>s+c.close,0)/period
        const std  = Math.sqrt(sl.reduce((s,c)=>s+(c.close-mean)**2,0)/period)
        upper.push(mean+2*std); lower.push(mean-2*std)
      })
      ctx.beginPath()
      upper.forEach((v,i) => { if(v===0)return; const x=pad+i*barStep+barWidth/2; i===0||upper[i-1]===0?ctx.moveTo(x,toY(v)):ctx.lineTo(x,toY(v)) })
      ctx.stroke()
      ctx.beginPath()
      lower.forEach((v,i) => { if(v===0)return; const x=pad+i*barStep+barWidth/2; i===0||lower[i-1]===0?ctx.moveTo(x,toY(v)):ctx.lineTo(x,toY(v)) })
      ctx.stroke()
    }

    // Candles + volume
    vis.forEach((b,i) => {
      const x   = pad + i * barStep
      const xc  = x + barWidth/2
      const isUp = b.close >= b.open
      const bodyColor = isUp ? C.upBody : C.dnBody
      const wickColor = isUp ? C.upWick : C.dnWick
      const by  = toY(Math.max(b.open,b.close))
      const bh  = Math.abs(toY(b.open)-toY(b.close)) || 1
      ctx.strokeStyle = wickColor; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(xc,toY(b.high)); ctx.lineTo(xc,toY(b.low)); ctx.stroke()
      ctx.fillStyle = bodyColor; ctx.fillRect(x, by, barWidth, bh)
      ctx.strokeStyle = wickColor; ctx.lineWidth = .5; ctx.strokeRect(x, by, barWidth, bh)
      // Volume
      vtx.fillStyle = isUp ? 'rgba(34,197,94,.28)' : 'rgba(239,68,68,.28)'
      const bvol = b.volume ?? 1000; vtx.fillRect(x, VH-(bvol/maxVol)*VH, barWidth, (bvol/maxVol)*VH)
    })

    // Key levels
    if (config.showLevels) {
      const lastPrice = vis[vis.length-1].close
      const hi = mn + rng*.98, lo = mn + rng*.02, pp = (hi+lo+lastPrice)/3
      ;[[hi,'R1',C.red],[pp,'PP',C.gold],[lo,'S1',C.green]].forEach(([lv,lb,lc]) => {
        const y = toY(lv as number)
        ctx.strokeStyle = lc as string; ctx.lineWidth = .5; ctx.setLineDash([3,3])
        ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W-40,y); ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = lc as string; ctx.font='8px Courier New'; ctx.textAlign='left'
        ctx.fillText(lb as string, 4, y-2)
      })
    }

    // Live price line
    const livePrice = ticks[config.symbol]?.price ?? vis[vis.length-1].close
    const py = toY(livePrice)
    ctx.strokeStyle = C.gold; ctx.lineWidth = 1; ctx.setLineDash([4,3])
    ctx.beginPath(); ctx.moveTo(0,py); ctx.lineTo(W-72,py); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = C.gold
    ctx.beginPath(); ctx.roundRect(W-70,py-8,70,16,2); ctx.fill()
    ctx.fillStyle = '#0a0c0f'; ctx.font='bold 9px Courier New'; ctx.textAlign='center'
    ctx.fillText(livePrice.toFixed(dec), W-35, py+3)

    // Drawing objects
    drawObjects.current.forEach(obj => {
      if (!obj.x2 && obj.tool !== 'hline') return
      ctx.strokeStyle = obj.color; ctx.lineWidth = 1.5; ctx.setLineDash([])
      if (obj.tool === 'trendline') {
        ctx.beginPath(); ctx.moveTo(obj.x1,obj.y1); ctx.lineTo(obj.x2!,obj.y2!); ctx.stroke()
      } else if (obj.tool === 'hline') {
        ctx.beginPath(); ctx.moveTo(0,obj.y1); ctx.lineTo(W,obj.y1); ctx.stroke()
      } else if (obj.tool === 'rect') {
        ctx.strokeRect(obj.x1,obj.y1,obj.x2!-obj.x1,obj.y2!-obj.y1)
      } else if (obj.tool === 'fibonacci') {
        const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]
        const dy = obj.y2! - obj.y1
        levels.forEach(l => {
          const y = obj.y1 + dy * l
          ctx.strokeStyle = `rgba(240,180,41,${0.3+l*0.3})`
          ctx.beginPath(); ctx.moveTo(Math.min(obj.x1,obj.x2!),y); ctx.lineTo(Math.max(obj.x1,obj.x2!),y); ctx.stroke()
          ctx.fillStyle = C.gold; ctx.font='8px Courier New'; ctx.textAlign='right'
          ctx.fillText(`${(l*100).toFixed(1)}%`, Math.min(obj.x1,obj.x2!)-2, y-2)
        })
      }
    })

    // Crosshair
    if (crosshair) {
      ctx.strokeStyle = 'rgba(240,180,41,0.4)'; ctx.lineWidth = .5; ctx.setLineDash([3,3])
      ctx.beginPath(); ctx.moveTo(crosshair.x,0); ctx.lineTo(crosshair.x,H); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0,crosshair.y); ctx.lineTo(W,crosshair.y); ctx.stroke()
      ctx.setLineDash([])
      // Price label
      const price = mn + ((H-pad-crosshair.y)/(H-pad*2))*rng
      ctx.fillStyle='rgba(240,180,41,0.9)'; ctx.beginPath(); ctx.roundRect(W-70,crosshair.y-8,70,16,2); ctx.fill()
      ctx.fillStyle='#0a0c0f'; ctx.font='bold 8px Courier New'; ctx.textAlign='center'
      ctx.fillText(price.toFixed(dec), W-35, crosshair.y+3)
    }

  }, [config, ticks, crosshair])

  // ResizeObserver
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => { draw() })
    ro.observe(el)
    return () => ro.disconnect()
  }, [draw])

  // Mouse events
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setCrosshair({ x, y })
    if (isDragging.current && activeTool === 'none') {
      const dx = e.movementX
      offsetRef.current = Math.max(0, offsetRef.current - dx / 7)
      draw()
    }
  }, [draw, activeTool])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY < 0 ? 1.1 : 0.9
    scaleRef.current = Math.max(0.3, Math.min(5, scaleRef.current * delta))
    draw()
  }, [draw])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    if (activeTool !== 'none') {
      setIsDrawing(true)
      setDrawStart({ x, y })
    } else {
      isDragging.current = true
    }
  }, [activeTool])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    isDragging.current = false
    if (!isDrawing || !drawStart) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x2 = e.clientX - rect.left
    const y2 = e.clientY - rect.top
    drawObjects.current.push({
      id: Date.now().toString(), tool: activeTool,
      color: activeTool === 'fibonacci' ? C.gold : C.red,
      x1: drawStart.x, y1: drawStart.y, x2, y2,
    })
    setIsDrawing(false)
    setDrawStart(null)
    draw()
  }, [isDrawing, drawStart, activeTool, draw])

  const dec = config.symbol.includes('JPY') || config.symbol === 'DXY' ? 3
            : config.symbol === 'GOLD' ? 1 : 5
  const tick = ticks[config.symbol]
  const livePrice = tick?.price
  const changePct = tick?.changePct ?? 0
  const isUp = changePct >= 0

  const filteredSymbols = symSearch
    ? SYMBOLS.filter(s => s.toLowerCase().includes(symSearch.toLowerCase()))
    : SYMBOLS

  return (
    <div ref={containerRef} style={{ display:'flex', flexDirection:'column', height:'100%', background:C.bg, overflow:'hidden' }} className={className}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 8px', flexShrink:0, background:C.bg2, borderBottom:`0.5px solid ${C.border}` }}>
        {/* Symbol */}
        <div style={{ position:'relative' }}>
          <button onClick={() => setShowSymbolSearch(v => !v)} style={{ padding:'2px 8px', background:C.bg4, border:`0.5px solid ${C.border2}`, color:'#e2e8f0', fontSize:11, fontWeight:700, fontFamily:'inherit', cursor:'pointer', borderRadius:2 }}>
            {config.symbol} ▾
          </button>
          {showSymbolSearch && (
            <div style={{ position:'absolute', top:'110%', left:0, background:C.bg2, border:`1px solid ${C.border2}`, borderRadius:3, zIndex:100, minWidth:140, boxShadow:'0 8px 24px rgba(0,0,0,0.6)' }}>
              <input autoFocus value={symSearch} onChange={e => setSymSearch(e.target.value)}
                placeholder="Search..." style={{ width:'100%', background:C.bg3, border:'none', borderBottom:`0.5px solid ${C.border}`, color:'#e2e8f0', fontSize:10, padding:'5px 8px', outline:'none', fontFamily:'inherit' }} />
              {filteredSymbols.map(s => (
                <button key={s} onClick={() => { updateChartConfig(instanceId, { symbol: s }); setShowSymbolSearch(false); setSymSearch('') }}
                  style={{ display:'block', width:'100%', padding:'5px 10px', background:'transparent', border:'none', color: s===config.symbol ? C.gold : C.text, fontSize:10, cursor:'pointer', textAlign:'left', fontFamily:'inherit' }}
                  onMouseEnter={e => e.currentTarget.style.background=C.bg4}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >{s}</button>
              ))}
            </div>
          )}
        </div>

        {/* Price */}
        {livePrice && (
          <>
            <span style={{ fontSize:16, fontWeight:700, color:'#f0f6ff', fontVariantNumeric:'tabular-nums' }}>{livePrice.toFixed(dec)}</span>
            <span style={{ fontSize:10, color: isUp ? C.green : C.red }}>{isUp?'+':''}{changePct.toFixed(2)}%</span>
          </>
        )}

        {/* Timeframe */}
        <div style={{ display:'flex', gap:1, marginLeft:4 }}>
          {TIMEFRAMES.map(tf => (
            <TBtn key={tf} label={tf} active={config.timeframe===tf} onClick={() => updateChartConfig(instanceId, { timeframe: tf })} />
          ))}
        </div>

        <div style={{ width:'0.5px', height:16, background:C.border, margin:'0 4px' }} />

        {/* Drawing tools */}
        <TBtn label="✕" active={activeTool==='none'} title="No tool" onClick={() => setActiveTool('none')} />
        {DRAW_TOOLS.map(t => (
          <TBtn key={t.id} label={t.label} active={activeTool===t.id} title={t.title} onClick={() => setActiveTool(activeTool===t.id ? 'none' : t.id)} />
        ))}
        {drawObjects.current.length > 0 && (
          <TBtn label="🗑" title="Clear drawings" onClick={() => { drawObjects.current=[]; draw() }} />
        )}

        <div style={{ width:'0.5px', height:16, background:C.border, margin:'0 4px' }} />

        {/* Indicators */}
        <div style={{ position:'relative' }}>
          <TBtn label="Indicators" active={showIndicators} onClick={() => setShowIndicators(v => !v)} />
          {showIndicators && (
            <div style={{ position:'absolute', top:'110%', left:0, background:C.bg2, border:`1px solid ${C.border2}`, borderRadius:3, zIndex:100, padding:8, minWidth:160, boxShadow:'0 8px 24px rgba(0,0,0,0.6)' }}>
              {[
                ['showVolume','Volume'],['showEMA20','EMA 20'],['showEMA50','EMA 50'],
                ['showEMA200','EMA 200'],['showBB','Bollinger Bands'],['showVWAP','VWAP'],
                ['showLevels','Key Levels'],
              ].map(([key, label]) => (
                <label key={key} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 0', cursor:'pointer', fontSize:10, color:C.text2 }}>
                  <input type="checkbox" checked={!!(config as any)[key]}
                    onChange={() => updateChartConfig(instanceId, { [key]: !(config as any)[key] })}
                    style={{ accentColor: C.gold, cursor:'pointer' }} />
                  {label}
                </label>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginLeft:'auto', display:'flex', gap:2 }}>
          {onFullscreen && <TBtn label="⛶" title="Fullscreen (Cmd+F)" onClick={onFullscreen} />}
        </div>
      </div>

      {/* ── Chart canvas ── */}
      <div style={{ flex:1, position:'relative', overflow:'hidden', cursor: activeTool !== 'none' ? 'crosshair' : 'default' }}>
        <canvas ref={canvasRef} style={{ width:'100%', height:'100%', display:'block' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setCrosshair(null)}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        />
      </div>

      {/* ── Volume ── */}
      {config.showVolume && (
        <div style={{ height:44, borderTop:`0.5px solid ${C.border}`, flexShrink:0 }}>
          <canvas ref={volRef} style={{ width:'100%', height:'100%', display:'block' }} />
        </div>
      )}
    </div>
  )
})
