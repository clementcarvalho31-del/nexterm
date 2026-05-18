'use client'
import { useEffect, memo } from 'react'
import { useWorkspaceManager } from '@/workspace/manager'
import { WorkspaceToolbar }    from './WorkspaceToolbar'
import { WorkspaceCanvas }     from './WorkspaceCanvas'
import { AddWidgetPanel }      from './AddWidgetPanel'
import { SaveLayoutModal }     from './SaveLayoutModal'
import { LAYOUT_PRESETS }      from '@/workspace/registry'

export const WorkspaceRoot = memo(function WorkspaceRoot() {
  const initWorkspace  = useWorkspaceManager(s => s.initWorkspace)
  const loadPreset     = useWorkspaceManager(s => s.loadPreset)
  const setSaveModal   = useWorkspaceManager(s => s.setSaveModalOpen)
  const setAddWidget   = useWorkspaceManager(s => s.setAddWidgetOpen)
  const resetToDefault = useWorkspaceManager(s => s.resetToDefault)
  const setFullscreen  = useWorkspaceManager(s => s.setFullscreen)
  const fullscreenId   = useWorkspaceManager(s => s.fullscreenId)

  // Init on mount
  useEffect(() => { initWorkspace() }, [initWorkspace])

  // Global hotkeys
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey

      // Escape — exit fullscreen
      if (e.key === 'Escape' && fullscreenId) {
        e.preventDefault()
        setFullscreen(null)
        return
      }

      if (!mod) return

      // Cmd+S — save layout
      if (e.key === 's') { e.preventDefault(); setSaveModal(true); return }

      // Cmd+N — add widget
      if (e.key === 'n') { e.preventDefault(); setAddWidget(true); return }

      // Cmd+Z — reset layout
      if (e.key === 'z') { e.preventDefault(); resetToDefault(); return }

      // Cmd+1..5 — load preset
      const idx = parseInt(e.key) - 1
      if (idx >= 0 && idx < LAYOUT_PRESETS.length) {
        e.preventDefault()
        loadPreset(LAYOUT_PRESETS[idx].id)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [fullscreenId, setFullscreen, setSaveModal, setAddWidget, resetToDefault, loadPreset])

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      <WorkspaceToolbar />
      <WorkspaceCanvas />
      <AddWidgetPanel />
      <SaveLayoutModal />
    </div>
  )
})
