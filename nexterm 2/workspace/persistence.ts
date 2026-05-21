import type { SavedLayout, WidgetInstance } from './types'
import type { LayoutPreset } from './types'
import { LAYOUT_PRESETS } from './registry'

const STORAGE_KEY   = 'nexterm_layouts_v2'
const ACTIVE_KEY    = 'nexterm_active_layout_v2'
const STORAGE_VER   = 2

interface StorageSchema {
  version: number
  layouts: SavedLayout[]
  activeId: string | null
}

// ─── Persistence layer ────────────────────────────────────────────────────────
export const LayoutPersistenceService = {
  load(): StorageSchema {
    if (typeof window === 'undefined') return { version: STORAGE_VER, layouts: [], activeId: null }
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return { version: STORAGE_VER, layouts: [], activeId: null }
      const parsed = JSON.parse(raw) as StorageSchema
      if (parsed.version !== STORAGE_VER) return { version: STORAGE_VER, layouts: [], activeId: null }
      return parsed
    } catch {
      return { version: STORAGE_VER, layouts: [], activeId: null }
    }
  },

  save(layouts: SavedLayout[], activeId: string | null) {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VER, layouts, activeId }))
    } catch { /* quota exceeded */ }
  },

  // Convert a LayoutPreset into a SavedLayout
  presetToSaved(preset: LayoutPreset): SavedLayout {
    return {
      id:        preset.id,
      name:      preset.name,
      createdAt: Date.now(),
      cols:      12,
      rowHeight: 40,
      widgets:   preset.widgets.map((w, i) => ({
        ...w,
        instanceId: `${w.widgetId}-${i}-${Date.now()}`,
      })),
    }
  },

  // Get all layouts (presets + custom)
  getAllLayouts(customLayouts: SavedLayout[]): SavedLayout[] {
    const presetLayouts = LAYOUT_PRESETS.map(p => this.presetToSaved(p))
    // Custom layouts override presets with same id
    const customIds = new Set(customLayouts.map(l => l.id))
    return [
      ...presetLayouts.filter(p => !customIds.has(p.id)),
      ...customLayouts,
    ]
  },
}
