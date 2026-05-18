import { create } from 'zustand'
import type { WorkspaceLayout, PanelConfig, PanelId } from '@/types'
import { WORKSPACE_PRESETS } from '@/types'

interface WorkspaceStore {
  currentLayout: WorkspaceLayout
  savedLayouts: WorkspaceLayout[]
  loadPreset: (presetName: keyof typeof WORKSPACE_PRESETS) => void
  updatePanelPosition: (id: PanelId, updates: Partial<PanelConfig['position']>) => void
  togglePanel: (id: PanelId) => void
  minimizePanel: (id: PanelId, minimized: boolean) => void
  saveCurrentLayout: (name: string) => void
  loadLayout: (id: string) => void
  resetToDefault: () => void
}

function makeLayout(presetKey: string): WorkspaceLayout {
  const preset = WORKSPACE_PRESETS[presetKey as keyof typeof WORKSPACE_PRESETS]
  return { id: `preset_${presetKey}`, ...preset }
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  currentLayout: makeLayout('default'),
  savedLayouts: [],

  loadPreset: (presetName) =>
    set({ currentLayout: makeLayout(presetName as string) }),

  updatePanelPosition: (id, updates) =>
    set(s => ({
      currentLayout: {
        ...s.currentLayout,
        panels: s.currentLayout.panels.map(p =>
          p.id === id ? { ...p, position: { ...p.position, ...updates } } : p
        ),
      },
    })),

  togglePanel: (id) =>
    set(s => ({
      currentLayout: {
        ...s.currentLayout,
        panels: s.currentLayout.panels.map(p =>
          p.id === id ? { ...p, visible: !p.visible } : p
        ),
      },
    })),

  minimizePanel: (id, minimized) =>
    set(s => ({
      currentLayout: {
        ...s.currentLayout,
        panels: s.currentLayout.panels.map(p =>
          p.id === id ? { ...p, minimized } : p
        ),
      },
    })),

  saveCurrentLayout: (name) => {
    const layout: WorkspaceLayout = {
      ...get().currentLayout,
      id: `custom_${Date.now()}`,
      name,
    }
    set(s => ({
      savedLayouts: [...s.savedLayouts, layout],
      currentLayout: layout,
    }))
  },

  loadLayout: (id) => {
    const layout = get().savedLayouts.find(l => l.id === id)
    if (layout) set({ currentLayout: layout })
  },

  resetToDefault: () => set({ currentLayout: makeLayout('default') }),
}))
