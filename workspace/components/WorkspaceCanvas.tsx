'use client'
import { useMemo, useCallback, memo } from 'react'
import ReactGridLayout, { type Layout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { AnimatePresence, motion } from 'framer-motion'
import { useWorkspaceManager } from '@/workspace/manager'
import { WidgetRenderer }      from './WidgetRenderer'
import { FloatingWidget }      from './FloatingWidget'
import type { WidgetInstance, WidgetId } from '@/workspace/types'

const COL_COUNT  = 12
const ROW_HEIGHT = 40

// ── Panel header with all controls ───────────────────────────────────────────
interface PanelHeaderProps {
  widget:          WidgetInstance
  onRemove:        () => void
  onMinimize:      () => void
  onMaximize:      () => void
  onFloat:         () => void
  onFullscreen:    () => void
}

const PanelHeader = memo(function PanelHeader({
  widget, onRemove, onMinimize, onMaximize, onFloat, onFullscreen,
}: PanelHeaderProps) {
  return (
    <div
      className="drag-handle"
      style={{
        display:'flex', alignItems:'center', gap:4, padding:'3px 8px',
        background:'#0f1520', borderBottom:'0.5px solid #1e2530',
        cursor:'grab', flexShrink:0, userSelect:'none', height:26,
      }}
    >
      <span style={{ fontSize:9, color:'#5a6373', letterSpacing:'.6px', textTransform:'uppercase', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {widget.title}
      </span>
      {widget.pinned && <span style={{ fontSize:8, color:'#f0b429', flexShrink:0 }}>📌</span>}
      <Ctrl label="⛶" title="Fullscreen"      onClick={onFullscreen} />
      <Ctrl label="⊟" title="Float / detach"  onClick={onFloat}     />
      <Ctrl label={widget.minimized ? '▢' : '─'} title="Minimize" onClick={onMinimize} />
      <Ctrl label="✕" title="Close"           onClick={onRemove}    color="#ef4444" />
    </div>
  )
})

function Ctrl({ label, title, onClick, color }: { label:string; title:string; onClick:()=>void; color?:string }) {
  return (
    <button
      title={title}
      onClick={e => { e.stopPropagation(); onClick() }}
      style={{ background:'none', border:'none', color: color ?? '#5a6373', cursor:'pointer', fontSize:10, padding:'0 2px', fontFamily:'inherit', lineHeight:1 }}
      onMouseEnter={e => e.currentTarget.style.color = color ?? '#8a9ab0'}
      onMouseLeave={e => e.currentTarget.style.color = color ?? '#5a6373'}
    >{label}</button>
  )
}

// ── FullscreenOverlay ─────────────────────────────────────────────────────────
function FullscreenOverlay({ instanceId }: { instanceId: string }) {
  const activeLayout  = useWorkspaceManager(s => s.activeLayout)
  const setFullscreen = useWorkspaceManager(s => s.setFullscreen)
  const widget = activeLayout?.widgets.find(w => w.instanceId === instanceId)
  if (!widget) return null

  return (
    <motion.div
      initial={{ opacity:0 }}
      animate={{ opacity:1 }}
      exit={{ opacity:0 }}
      transition={{ duration:.15 }}
      style={{ position:'fixed', inset:0, zIndex:500, background:'#0a0c0f', display:'flex', flexDirection:'column' }}
    >
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 12px', background:'#0d1117', borderBottom:'1px solid #1e2530', flexShrink:0 }}>
        <span style={{ fontSize:10, color:'#f0b429', fontWeight:700 }}>{widget.title} — FULLSCREEN</span>
        <button onClick={() => setFullscreen(null)}
          style={{ background:'none', border:'0.5px solid #2a3444', color:'#8a9ab0', cursor:'pointer', fontSize:9, padding:'3px 10px', borderRadius:2, fontFamily:'inherit' }}>
          ESC — Exit fullscreen
        </button>
      </div>
      <div style={{ flex:1, overflow:'hidden' }}>
        <WidgetRenderer widgetId={widget.widgetId} instanceId={widget.instanceId} onFullscreen={() => setFullscreen(null)} />
      </div>
    </motion.div>
  )
}

// ── Main canvas ───────────────────────────────────────────────────────────────
export const WorkspaceCanvas = memo(function WorkspaceCanvas() {
  const activeLayout      = useWorkspaceManager(s => s.activeLayout)
  const fullscreenId      = useWorkspaceManager(s => s.fullscreenId)
  const updateWidgetLayout= useWorkspaceManager(s => s.updateWidgetLayout)
  const removeWidget      = useWorkspaceManager(s => s.removeWidget)
  const toggleMinimize    = useWorkspaceManager(s => s.toggleMinimize)
  const toggleMaximize    = useWorkspaceManager(s => s.toggleMaximize)
  const toggleFloat       = useWorkspaceManager(s => s.toggleFloat)
  const setFullscreen     = useWorkspaceManager(s => s.setFullscreen)

  const docked    = useMemo(() => activeLayout?.widgets.filter(w => w.visible && !w.floating) ?? [], [activeLayout])
  const floating  = useMemo(() => activeLayout?.widgets.filter(w => w.visible && w.floating)  ?? [], [activeLayout])

  const gridLayout: Layout[] = useMemo(
    () => docked.map(w => ({
      i:    w.instanceId,
      x:    w.x, y: w.y,
      w:    w.w, h: w.minimized ? 1 : w.h,
      minW: w.pinned ? w.w : w.minW,
      minH: w.pinned ? w.h : (w.minimized ? 1 : w.minH),
      static: w.pinned,
    })),
    [docked]
  )

  const onLayoutChange = useCallback((newLayout: Layout[]) => {
    newLayout.forEach(item => {
      updateWidgetLayout(item.i, { x: item.x, y: item.y, w: item.w, h: item.h })
    })
  }, [updateWidgetLayout])

  if (!activeLayout) return null

  return (
    <div style={{ flex:1, overflow:'auto', background:'#0a0c0f', position:'relative' }}>
      <ReactGridLayout
        layout={gridLayout}
        cols={COL_COUNT}
        rowHeight={ROW_HEIGHT}
        width={1400}
        onLayoutChange={onLayoutChange}
        draggableHandle=".drag-handle"
        resizeHandles={['se', 's', 'e', 'sw', 'w']}
        margin={[3, 3]}
        containerPadding={[4, 4]}
        isDraggable
        isResizable
        compactType="vertical"
        useCSSTransforms
      >
        {docked.map(widget => (
          <div
            key={widget.instanceId}
            style={{ background:'#0d1117', border:'0.5px solid #1e2530', display:'flex', flexDirection:'column', overflow:'hidden', borderRadius:2 }}
          >
            <PanelHeader
              widget={widget}
              onRemove={()      => removeWidget(widget.instanceId)}
              onMinimize={()    => toggleMinimize(widget.instanceId)}
              onMaximize={()    => toggleMaximize(widget.instanceId)}
              onFloat={()       => toggleFloat(widget.instanceId)}
              onFullscreen={()  => setFullscreen(widget.instanceId)}
            />
            {!widget.minimized && (
              <div style={{ flex:1, overflow:'hidden', minHeight:0 }}>
                <WidgetRenderer
                  widgetId={widget.widgetId}
                  instanceId={widget.instanceId}
                  onFullscreen={() => setFullscreen(widget.instanceId)}
                />
              </div>
            )}
          </div>
        ))}
      </ReactGridLayout>

      {/* Floating widgets */}
      {floating.map(w => <FloatingWidget key={w.instanceId} widget={w} />)}

      {/* Fullscreen overlay */}
      <AnimatePresence>
        {fullscreenId && <FullscreenOverlay key="fs" instanceId={fullscreenId} />}
      </AnimatePresence>
    </div>
  )
})
