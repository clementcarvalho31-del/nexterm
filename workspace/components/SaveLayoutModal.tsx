'use client'
import { useState, memo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useWorkspaceManager } from '@/workspace/manager'

export const SaveLayoutModal = memo(function SaveLayoutModal() {
  const saveModalOpen = useWorkspaceManager(s => s.saveModalOpen)
  const setSaveModal  = useWorkspaceManager(s => s.setSaveModalOpen)
  const saveLayout    = useWorkspaceManager(s => s.saveLayout)
  const [name, setName] = useState('')

  const submit = () => {
    if (!name.trim()) return
    saveLayout(name.trim())
    setName('')
  }

  return (
    <AnimatePresence>
      {saveModalOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:400, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.65)' }}
          onClick={() => setSaveModal(false)}>
          <motion.div
            initial={{ opacity:0, scale:0.94, y:-10 }}
            animate={{ opacity:1, scale:1, y:0 }}
            exit={{ opacity:0, scale:0.94 }}
            transition={{ duration:.15 }}
            style={{ background:'#0d1117', border:'1px solid #2a3444', borderRadius:4, padding:20, width:320, zIndex:401 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize:11, color:'#f0b429', fontWeight:700, marginBottom:12 }}>SAVE LAYOUT</div>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="Layout name..."
              style={{ width:'100%', background:'#0a0c0f', border:'0.5px solid #2a3444', color:'#e2e8f0', fontSize:11, padding:'6px 8px', borderRadius:2, outline:'none', fontFamily:'inherit', marginBottom:10 }}
              onFocus={e => e.currentTarget.style.borderColor='#f0b429'}
              onBlur={e => e.currentTarget.style.borderColor='#2a3444'}
            />
            <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
              <button onClick={() => setSaveModal(false)} style={{ padding:'5px 12px', background:'transparent', border:'0.5px solid #2a3444', color:'#5a6373', fontSize:9, borderRadius:2, cursor:'pointer', fontFamily:'inherit' }}>
                Cancel
              </button>
              <button onClick={submit} disabled={!name.trim()} style={{ padding:'5px 12px', background: name.trim() ? '#f0b429' : '#2a3444', border:'none', color: name.trim() ? '#0a0c0f' : '#5a6373', fontSize:9, fontWeight:700, borderRadius:2, cursor: name.trim() ? 'pointer' : 'default', fontFamily:'inherit' }}>
                SAVE
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
})
