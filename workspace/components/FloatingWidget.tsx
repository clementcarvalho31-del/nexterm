'use client'
import { useRef, useCallback, memo } from 'react'
import { useWorkspaceManager } from '@/workspace/manager'
import { WidgetRenderer }      from './WidgetRenderer'
import type { WidgetInstance } from '@/workspace/types'

interface FloatingWidgetProps {
  widget: WidgetInstance
}

export const FloatingWidget = memo(function FloatingWidget({ widget }: FloatingWidgetProps) {
  const updateFloatPos = useWorkspaceManager(s => s.updateFloatPos)
  const removeWidget   = useWorkspaceManager(s => s.removeWidget)
  const toggleFloat    = useWorkspaceManager(s => s.toggleFloat)
  const setFullscreen  = useWorkspaceManager(s => s.setFullscreen)

  const dragging  = useRef(false)
  const startPos  = useRef({ x: 0, y: 0, fx: 0, fy: 0 })

  const x = widget.floatX ?? 120
  const y = widget.floatY ?? 80
  const w = widget.floatW ?? 640
  const h = widget.floatH ?? 440

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    startPos.current = { x: e.clientX, y: e.clientY, fx: x, fy: y }

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      const nx = startPos.current.fx + ev.clientX - startPos.current.x
      const ny = startPos.current.fy + ev.clientY - startPos.current.y
      updateFloatPos(widget.instanceId, Math.max(0, nx), Math.max(0, ny))
    }
    const onUp = () => {
      dragging.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [x, y, widget.instanceId, updateFloatPos])

  return (
    <div style={{
      position: 'fixed',
      left: x, top: y, width: w, height: h,
      background: '#0d1117',
      border: '1px solid #2a3444',
      borderRadius: 3,
      zIndex: 200,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
    }}>
      {/* Drag handle */}
      <div
        onMouseDown={onMouseDown}
        style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 8px', background:'#0f1520', borderBottom:'0.5px solid #1e2530', cursor:'grab', flexShrink:0, userSelect:'none' }}
      >
        <span style={{ fontSize:9, color:'#5a6373', letterSpacing:'.8px', flex:1, textTransform:'uppercase' }}>
          {widget.title}
        </span>
        <span style={{ fontSize:8, color:'#5a6373', border:'0.5px solid #2a3444', padding:'1px 4px', borderRadius:2 }}>FLOAT</span>
        <button onClick={() => toggleFloat(widget.instanceId)}
          title="Dock back" style={btn}>⊟</button>
        <button onClick={() => setFullscreen(widget.instanceId)}
          title="Fullscreen" style={btn}>⛶</button>
        <button onClick={() => removeWidget(widget.instanceId)}
          title="Close" style={{ ...btn, color:'#ef4444' }}>✕</button>
      </div>
      <div style={{ flex:1, overflow:'hidden' }}>
        <WidgetRenderer widgetId={widget.widgetId} instanceId={widget.instanceId} onFullscreen={() => setFullscreen(widget.instanceId)} />
      </div>
    </div>
  )
})

const btn: React.CSSProperties = {
  background:'none', border:'none', color:'#5a6373', cursor:'pointer',
  fontSize:11, padding:'0 2px', fontFamily:'inherit', lineHeight:1,
}
