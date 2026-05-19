'use client'
import { useEffect, useState, memo } from 'react'
import { useChartManager } from '../sync/ChartSyncManager'
import { KlineChart }        from './KlineChart'
import { TradingViewChart }  from './TradingViewChart'
import { CHART_THEMES }      from '../themes/chartThemes'
import type { ChartEngineType, ChartThemeId, Timeframe } from '../types'

interface UnifiedChartProps {
  instanceId:    string
  symbol?:       string
  timeframe?:    Timeframe
  engine?:       ChartEngineType
  themeId?:      ChartThemeId
  className?:    string
  onFullscreen?: () => void
}

export const UnifiedChart = memo(function UnifiedChart({
  instanceId,
  symbol       = 'EUR/USD',
  timeframe    = 'M15',
  engine       = 'klinecharts',
  themeId      = 'dark-terminal',
  className,
  onFullscreen,
}: UnifiedChartProps) {
  const registerInstance   = useChartManager(s => s.registerInstance)
  const unregisterInstance = useChartManager(s => s.unregisterInstance)
  const inst               = useChartManager(s => s.instances[instanceId])

  // Register this chart instance on mount
  useEffect(() => {
    registerInstance(instanceId, { symbol, timeframe, engine, themeId })
    return () => unregisterInstance(instanceId)
  }, [instanceId])  // Only on mount/unmount

  const activeEngine = inst?.engine ?? engine
  const theme        = CHART_THEMES[inst?.themeId ?? themeId]

  return (
    <div
      className={className}
      style={{ height:'100%', position:'relative', overflow:'hidden' }}
    >
      {/* Engine toggle strip */}
      <EngineToggle instanceId={instanceId} theme={theme} />

      {/* Chart */}
      <div style={{ height:'calc(100% - 20px)', overflow:'hidden' }}>
        {activeEngine === 'tradingview' ? (
          <TradingViewChart instanceId={instanceId} className="h-full" onFullscreen={onFullscreen} />
        ) : (
          <KlineChart instanceId={instanceId} className="h-full" onFullscreen={onFullscreen} />
        )}
      </div>
    </div>
  )
})

function EngineToggle({ instanceId, theme }: { instanceId: string; theme: import('../types').ChartTheme }) {
  const inst      = useChartManager(s => s.instances[instanceId])
  const register  = useChartManager(s => s.registerInstance)

  const switchEngine = (e: ChartEngineType) => {
    register(instanceId, { ...inst, engine: e })
  }

  const activeEngine = inst?.engine ?? 'klinecharts'

  return (
    <div style={{ display:'flex', alignItems:'center', gap:2, height:20, padding:'0 6px', background:theme.bg, borderBottom:`0.5px solid ${theme.borderColor}` }}>
      <span style={{ fontSize:8, color:theme.textMuted, marginRight:4, letterSpacing:'0.8px' }}>ENGINE</span>
      <button
        onClick={() => switchEngine('klinecharts')}
        style={{
          padding:'1px 6px', fontSize:8, fontFamily:"'Courier New',monospace", cursor:'pointer',
          background: activeEngine==='klinecharts' ? `${theme.crosshair}18` : 'transparent',
          border: `0.5px solid ${activeEngine==='klinecharts' ? theme.crosshair : 'transparent'}`,
          color: activeEngine==='klinecharts' ? theme.crosshair : theme.textMuted,
          borderRadius:2,
        }}
        title="KlineCharts: custom realtime WebSocket data"
      >
        KlineCharts
      </button>
      <button
        onClick={() => switchEngine('tradingview')}
        style={{
          padding:'1px 6px', fontSize:8, fontFamily:"'Courier New',monospace", cursor:'pointer',
          background: activeEngine==='tradingview' ? '#1a2a4a' : 'transparent',
          border: `0.5px solid ${activeEngine==='tradingview' ? '#4a8acd' : 'transparent'}`,
          color: activeEngine==='tradingview' ? '#4a8acd' : theme.textMuted,
          borderRadius:2,
        }}
        title="TradingView: full TV platform with all indicators and drawing tools"
      >
        TradingView
      </button>
      {inst?.linked && (
        <span style={{ fontSize:7, color:theme.crosshair, marginLeft:4 }}>🔗 SYNCED</span>
      )}
    </div>
  )
}
