'use client'
import { useState, memo, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { UnifiedChart }     from './UnifiedChart'
import { useChartManager }  from '../sync/ChartSyncManager'
import { MULTI_CHART_LAYOUTS } from '../types'
import type { MultiChartLayoutId, Timeframe, ChartThemeId } from '../types'
import { CHART_THEMES } from '../themes/chartThemes'

const DEFAULT_SYMBOLS: Record<number, string[]> = {
  1: ['EUR/USD'],
  2: ['EUR/USD', 'GBP/USD'],
  3: ['EUR/USD', 'GBP/USD', 'USD/JPY'],
  4: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'DXY'],
}

interface MultiChartViewProps {
  baseInstanceId?: string
  defaultLayout?:  MultiChartLayoutId
}

export const MultiChartView = memo(function MultiChartView({
  baseInstanceId = 'chart',
  defaultLayout  = '1',
}: MultiChartViewProps) {
  const [layoutId,   setLayoutId]   = useState<MultiChartLayoutId>(defaultLayout)
  const [fullscreenIdx, setFsIdx]   = useState<number | null>(null)
  const globalTheme  = useChartManager(s => s.globalTheme)
  const setGlobalTheme = useChartManager(s => s.setGlobalTheme)

  const layout = MULTI_CHART_LAYOUTS.find(l => l.id === layoutId) ?? MULTI_CHART_LAYOUTS[0]
  const symbols = DEFAULT_SYMBOLS[layout.count] ?? DEFAULT_SYMBOLS[1]
  const theme   = CHART_THEMES[globalTheme]

  // Build instance IDs
  const instanceIds = useMemo(
    () => Array.from({ length: layout.count }, (_, i) => `${baseInstanceId}_${i}`),
    [baseInstanceId, layout.count]
  )

  const gridStyle: React.CSSProperties = useMemo(() => {
    switch (layoutId) {
      case '1':   return { gridTemplateColumns:'1fr', gridTemplateRows:'1fr' }
      case '2h':  return { gridTemplateColumns:'1fr 1fr', gridTemplateRows:'1fr' }
      case '2v':  return { gridTemplateColumns:'1fr', gridTemplateRows:'1fr 1fr' }
      case '2+1': return { gridTemplateColumns:'2fr 1fr', gridTemplateRows:'1fr' }
      case '3h':  return { gridTemplateColumns:'1fr 1fr 1fr', gridTemplateRows:'1fr' }
      case '4':   return { gridTemplateColumns:'1fr 1fr', gridTemplateRows:'1fr 1fr' }
      default:    return { gridTemplateColumns:'1fr', gridTemplateRows:'1fr' }
    }
  }, [layoutId])

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:theme.bg }}>
      {/* ── Layout toolbar ── */}
      <div style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 8px', background:theme.bgSecondary, borderBottom:`0.5px solid ${theme.borderColor}`, flexShrink:0, height:28 }}>
        <span style={{ fontSize:8, color:theme.textMuted, letterSpacing:'1px', marginRight:4 }}>LAYOUT</span>
        {MULTI_CHART_LAYOUTS.map(l => (
          <button key={l.id} onClick={() => setLayoutId(l.id)}
            style={{
              padding:'2px 8px', fontSize:9, fontFamily:"'Courier New',monospace", cursor:'pointer',
              background: l.id===layoutId ? `${theme.crosshair}18` : 'transparent',
              border: `0.5px solid ${l.id===layoutId ? theme.crosshair : 'transparent'}`,
              color: l.id===layoutId ? theme.crosshair : theme.textMuted,
              borderRadius:2, transition:'all .1s',
            }}
            title={l.label}
          >{l.icon} {l.label}</button>
        ))}

        <div style={{ width:1, height:14, background:theme.borderColor, margin:'0 4px' }} />

        {/* Global theme */}
        <span style={{ fontSize:8, color:theme.textMuted, letterSpacing:'1px' }}>THEME</span>
        {(['dark-terminal','dark-pro','light-clean','bloomberg'] as ChartThemeId[]).map(tid => (
          <button key={tid} onClick={() => setGlobalTheme(tid)}
            style={{
              width:14, height:14, borderRadius:'50%', cursor:'pointer',
              background: CHART_THEMES[tid].upColor,
              border: `2px solid ${tid===globalTheme ? theme.crosshair : 'transparent'}`,
              padding:0,
            }}
            title={CHART_THEMES[tid].name}
          />
        ))}

        <div style={{ flex:1 }} />
        <span style={{ fontSize:8, color:theme.textMuted }}>{layout.count} chart{layout.count > 1 ? 's' : ''}</span>
      </div>

      {/* ── Chart grid ── */}
      <div style={{ flex:1, display:'grid', gap:2, minHeight:0, ...gridStyle }}>
        {instanceIds.map((id, i) => (
          <div key={id} style={{ border:`0.5px solid ${theme.borderColor}`, overflow:'hidden', minHeight:0, position:'relative' }}>
            <UnifiedChart
              instanceId={id}
              symbol={symbols[i] ?? symbols[0]}
              themeId={globalTheme}
              className="h-full"
              onFullscreen={() => setFsIdx(i)}
            />
          </div>
        ))}
      </div>

      {/* ── Fullscreen overlay ── */}
      <AnimatePresence>
        {fullscreenIdx !== null && (
          <motion.div
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, zIndex:500, background:theme.bg, display:'flex', flexDirection:'column' }}
          >
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 12px', background:theme.bgSecondary, borderBottom:`0.5px solid ${theme.borderColor}`, flexShrink:0 }}>
              <span style={{ fontSize:10, color:theme.crosshair, fontWeight:700, fontFamily:"'Courier New',monospace" }}>
                CHART {fullscreenIdx + 1} — FULLSCREEN
              </span>
              <button
                onClick={() => setFsIdx(null)}
                style={{ background:'transparent', border:`0.5px solid ${theme.borderColor}`, color:theme.textMuted, cursor:'pointer', fontSize:9, padding:'3px 10px', borderRadius:2, fontFamily:"'Courier New',monospace" }}
              >
                ESC — Exit fullscreen
              </button>
            </div>
            <div style={{ flex:1, overflow:'hidden' }}>
              <UnifiedChart
                instanceId={`${instanceIds[fullscreenIdx]}_fs`}
                symbol={symbols[fullscreenIdx] ?? symbols[0]}
                themeId={globalTheme}
                className="h-full"
                onFullscreen={() => setFsIdx(null)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})
