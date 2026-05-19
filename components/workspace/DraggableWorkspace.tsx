'use client'
import { useMemo, useCallback, useState } from 'react'
import ReactGridLayout, { type Layout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { useWorkspaceStore } from '@/store/workspace'
import { ChartPanel }        from '@/modules/chart/ChartPanel'
import { NewsFeedPanel }     from '@/modules/news/NewsFeedPanel'
import { COTPanel }          from '@/modules/cot/COTPanel'
import { CalendarPanel }     from '@/modules/calendar/CalendarPanel'
import { NewsPlayPanel }     from '@/modules/newsplay/NewsPlayPanel'
import { SeasonalityPanel }  from '@/modules/seasonality/SeasonalityPanel'
import { WorldbookPanel }    from '@/modules/worldbook/WorldbookPanel'
import { LiquidityPanel }    from '@/modules/liquidity/LiquidityPanel'
import { YieldsPanel }        from '@/modules/yields/YieldsPanel'
import { FlowsPanel }         from '@/modules/flows/FlowsPanel'
import { CopilotPanel }       from '@/modules/copilot/CopilotPanel'

import type { PanelId, PanelConfig } from '@/types'
import { WORKSPACE_PRESETS } from '@/types'

const PANEL_REGISTRY: Partial<Record<PanelId, () => React.ReactElement>> = {
  'news-feed':     () => <NewsFeedPanel />,
  'chart-eurusd':  () => <ChartPanel symbol="EUR/USD" className="h-full" />,
  'chart-gbpusd':  () => <ChartPanel symbol="GBP/USD" className="h-full" />,
  'chart-usdjpy':  () => <ChartPanel symbol="USD/JPY" className="h-full" />,
  'cot':           () => <COTPanel />,
  'calendar':      () => <CalendarPanel />,
  'newsplay':      () => <NewsPlayPanel />,
  'seasonality':   () => <SeasonalityPanel />,
  'worldbook':     () => <WorldbookPanel />,
  'liquidity':     () => <LiquidityPanel />,
  'ai-copilot':    () => <CopilotPanel />,
  'copilot':       () => <CopilotPanel />,
  'yields':        () => <YieldsPanel />,
  'flows':         () => <FlowsPanel />,



}

const PRESET_KEYS = Object.keys(WORKSPACE_PRESETS) as Array<keyof typeof WORKSPACE_PRESETS>

export function DraggableWorkspace() {
  const { currentLayout, loadPreset, updatePanelPosition, togglePanel, minimizePanel } = useWorkspaceStore()
  const [containerWidth] = useState(1280)

  const visiblePanels = useMemo(
    () => currentLayout.panels.filter(p => p.visible),
    [currentLayout.panels]
  )

  const gridLayout: Layout[] = useMemo(
    () => visiblePanels.map(p => ({
      i: p.id, x: p.position.x, y: p.position.y,
      w: p.position.w, h: p.minimized ? 1 : p.position.h,
      minW: p.position.minW ?? 2, minH: p.minimized ? 1 : (p.position.minH ?? 3),
      static: false,
    })),
    [visiblePanels]
  )

  const onLayoutChange = useCallback((newLayout: Layout[]) => {
    newLayout.forEach(item => {
      updatePanelPosition(item.i as PanelId, { x: item.x, y: item.y, w: item.w, h: item.h })
    })
  }, [updatePanelPosition])

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 12px', height:28, background:'#0d1117', borderBottom:'1px solid #1e2530', flexShrink:0 }}>
        <span style={{ fontSize:9, color:'#5a6373', letterSpacing:'1px' }}>LAYOUT:</span>
        {PRESET_KEYS.map(key => {
          const isActive = currentLayout.name === WORKSPACE_PRESETS[key].name
          return (
            <button key={key} onClick={() => loadPreset(key)} style={{ fontSize:9, padding:'2px 8px', border:`0.5px solid ${isActive?'#2a3444':'transparent'}`, color:isActive?'#f0b429':'#5a6373', background:'transparent', cursor:'pointer', borderRadius:2 }}>
              {WORKSPACE_PRESETS[key].name.toUpperCase()}
            </button>
          )
        })}
        <span style={{ marginLeft:'auto', fontSize:9, color:'#3d4a5a' }}>Drag · Resize · ✕ Close</span>
      </div>

      <div style={{ flex:1, overflow:'auto', background:'#0a0c0f' }}>
        <ReactGridLayout
          layout={gridLayout}
          cols={12}
          rowHeight={40}
          width={containerWidth}
          onLayoutChange={onLayoutChange}
          draggableHandle=".drag-handle"
          resizeHandles={['se','s','e']}
          margin={[3,3]}
          containerPadding={[4,4]}
          isDraggable
          isResizable
          compactType="vertical"
        >
          {visiblePanels.map(panel => (
            <div key={panel.id} style={{ background:'#0d1117', border:'0.5px solid #1e2530', overflow:'hidden', display:'flex', flexDirection:'column' }}>
              <PanelHeader panel={panel} onMinimize={minimizePanel} onClose={togglePanel} />
              {!panel.minimized && (
                <div style={{ flex:1, overflow:'hidden', minHeight:0 }}>
                  {PANEL_REGISTRY[panel.id]?.() ?? (
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#5a6373', fontSize:9 }}>{panel.title}</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </ReactGridLayout>
      </div>
    </div>
  )
}

function PanelHeader({ panel, onMinimize, onClose }: { panel: PanelConfig; onMinimize:(id:PanelId,m:boolean)=>void; onClose:(id:PanelId)=>void }) {
  return (
    <div className="drag-handle" style={{ display:'flex', alignItems:'center', gap:6, padding:'3px 8px', flexShrink:0, cursor:'grab', userSelect:'none', background:'#0f1520', borderBottom:'0.5px solid #1e2530' }}>
      <span style={{ fontSize:9, color:'#5a6373', letterSpacing:'0.8px', textTransform:'uppercase', flex:1 }}>{panel.title}</span>
      <button onClick={() => onMinimize(panel.id, !panel.minimized)} style={{ fontSize:9, color:'#5a6373', background:'none', border:'none', cursor:'pointer', padding:'0 4px' }}>
        {panel.minimized ? '▢' : '─'}
      </button>
      <button onClick={() => onClose(panel.id)} style={{ fontSize:9, color:'#5a6373', background:'none', border:'none', cursor:'pointer', padding:'0 4px' }}>✕</button>
    </div>
  )
}
