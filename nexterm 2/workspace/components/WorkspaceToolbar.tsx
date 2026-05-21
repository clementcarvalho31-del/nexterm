'use client'
import { memo } from 'react'
import { useWorkspaceManager } from '@/workspace/manager'
import { LAYOUT_PRESETS }      from '@/workspace/registry'

export const WorkspaceToolbar = memo(function WorkspaceToolbar() {
  const activeLayout   = useWorkspaceManager(s => s.activeLayout)
  const savedLayouts   = useWorkspaceManager(s => s.savedLayouts)
  const loadPreset     = useWorkspaceManager(s => s.loadPreset)
  const loadLayout     = useWorkspaceManager(s => s.loadLayout)
  const setAddWidget   = useWorkspaceManager(s => s.setAddWidgetOpen)
  const setSaveModal   = useWorkspaceManager(s => s.setSaveModalOpen)
  const resetToDefault = useWorkspaceManager(s => s.resetToDefault)

  return (
    <div style={{ display:'flex', alignItems:'center', gap:4, padding:'0 8px', height:28, background:'#0d1117', borderBottom:'1px solid #1e2530', flexShrink:0, overflowX:'auto' }}>

      {/* Preset layouts */}
      <span style={{ fontSize:8, color:'#3d4a5a', letterSpacing:'1px', marginRight:2, flexShrink:0 }}>LAYOUT</span>
      {LAYOUT_PRESETS.map((preset, i) => {
        const isActive = activeLayout?.id === preset.id
        return (
          <button
            key={preset.id}
            onClick={() => loadPreset(preset.id)}
            title={`Cmd+${i+1}`}
            style={{
              padding:'2px 8px', fontSize:8, fontFamily:'inherit', cursor:'pointer', flexShrink:0,
              background:  isActive ? '#131821' : 'transparent',
              border:      `0.5px solid ${isActive ? '#2a3444' : 'transparent'}`,
              color:       isActive ? '#f0b429' : '#5a6373',
              borderRadius:2, transition:'all .1s',
            }}
            onMouseEnter={e => { if(!isActive) e.currentTarget.style.color='#8a9ab0' }}
            onMouseLeave={e => { if(!isActive) e.currentTarget.style.color='#5a6373'  }}
          >
            {preset.name}
          </button>
        )
      })}

      {/* Custom saved layouts */}
      {savedLayouts.length > 0 && (
        <>
          <div style={{ width:1, height:14, background:'#1e2530', margin:'0 2px', flexShrink:0 }} />
          {savedLayouts.map(layout => {
            const isActive = activeLayout?.id === layout.id
            return (
              <button
                key={layout.id}
                onClick={() => loadLayout(layout.id)}
                style={{
                  padding:'2px 8px', fontSize:8, fontFamily:'inherit', cursor:'pointer', flexShrink:0,
                  background:  isActive ? '#131821' : 'transparent',
                  border:      `0.5px solid ${isActive ? '#f0b429' : 'transparent'}`,
                  color:       isActive ? '#f0b429' : '#5a6373',
                  borderRadius:2, transition:'all .1s',
                }}
              >
                ★ {layout.name}
              </button>
            )
          })}
        </>
      )}

      <div style={{ flex:1 }} />

      {/* Actions */}
      <button onClick={() => setSaveModal(true)} title="Cmd+S"
        style={actionBtn}>
        Save
      </button>
      <button onClick={() => setAddWidget(true)} title="Cmd+N"
        style={{ ...actionBtn, color:'#f0b429', borderColor:'#2a3444' }}>
        + Widget
      </button>
      <button onClick={resetToDefault} title="Reset layout"
        style={{ ...actionBtn, fontSize:10 }}>
        ↺
      </button>
    </div>
  )
})

const actionBtn: React.CSSProperties = {
  padding:'2px 8px', fontSize:8, fontFamily:'inherit', cursor:'pointer',
  background:'transparent', border:'0.5px solid #1e2530', color:'#5a6373',
  borderRadius:2, transition:'all .1s', flexShrink:0,
}
