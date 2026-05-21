'use client'
import { memo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useWorkspaceManager } from '@/workspace/manager'
import { WIDGET_REGISTRY }     from '@/workspace/registry'
import type { WidgetId }       from '@/workspace/types'

const CATEGORIES = ['chart', 'data', 'analysis', 'ai'] as const

export const AddWidgetPanel = memo(function AddWidgetPanel() {
  const addWidgetOpen  = useWorkspaceManager(s => s.addWidgetOpen)
  const setAddWidget   = useWorkspaceManager(s => s.setAddWidgetOpen)
  const addWidget      = useWorkspaceManager(s => s.addWidget)

  return (
    <AnimatePresence>
      {addWidgetOpen && (
        <>
          <div onClick={() => setAddWidget(false)}
            style={{ position:'fixed', inset:0, zIndex:299, background:'rgba(0,0,0,0.5)' }} />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              position:'fixed', right:0, top:0, bottom:0, width:280, zIndex:300,
              background:'#0d1117', borderLeft:'1px solid #2a3444',
              display:'flex', flexDirection:'column', overflow:'hidden',
            }}
          >
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderBottom:'0.5px solid #1e2530', flexShrink:0 }}>
              <span style={{ fontSize:10, color:'#f0b429', fontWeight:700, letterSpacing:'1px' }}>ADD WIDGET</span>
              <button onClick={() => setAddWidget(false)} style={{ background:'none', border:'none', color:'#5a6373', cursor:'pointer', fontSize:14 }}>✕</button>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:8 }}>
              {CATEGORIES.map(cat => {
                const widgets = Object.values(WIDGET_REGISTRY).filter(w => w.category === cat)
                if (!widgets.length) return null
                return (
                  <div key={cat} style={{ marginBottom:12 }}>
                    <div style={{ fontSize:8, color:'#5a6373', letterSpacing:'1.2px', textTransform:'uppercase', marginBottom:5, paddingLeft:4 }}>
                      {cat}
                    </div>
                    {widgets.map(w => (
                      <button
                        key={w.id}
                        onClick={() => addWidget(w.id as WidgetId)}
                        style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'7px 10px', background:'transparent', border:'0.5px solid #1e2530', borderRadius:2, marginBottom:3, cursor:'pointer', fontFamily:'inherit', textAlign:'left', transition:'all .1s' }}
                        onMouseEnter={e => { e.currentTarget.style.background='#131821'; e.currentTarget.style.borderColor='#2a3444' }}
                        onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='#1e2530' }}
                      >
                        <span style={{ fontSize:14 }}>{w.icon}</span>
                        <div>
                          <div style={{ fontSize:10, color:'#e2e8f0', fontWeight:700 }}>{w.label}</div>
                          <div style={{ fontSize:8, color:'#5a6373', marginTop:1, lineHeight:1.4 }}>{w.description}</div>
                        </div>
                        <span style={{ marginLeft:'auto', fontSize:9, color:'#3d4a5a' }}>+</span>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
})
