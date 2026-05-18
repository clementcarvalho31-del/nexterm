import { create } from 'zustand'
import type { SavedLayout, WidgetInstance, WidgetId, ChartConfig } from './types'
import { LayoutPersistenceService } from './persistence'
import { LAYOUT_PRESETS, WIDGET_REGISTRY } from './registry'

let idCounter = 0
function newInstanceId(widgetId: string): string {
  return `${widgetId}-${Date.now()}-${++idCounter}`
}

// ─── Chart configs store (per-instance) ──────────────────────────────────────
const DEFAULT_CHART_CONFIG: ChartConfig = {
  symbol:     'EUR/USD',
  timeframe:  'M15',
  indicators: [],
  showVolume: true,
  showEMA20:  true,
  showEMA50:  true,
  showEMA200: false,
  showBB:     false,
  showVWAP:   false,
  showLevels: true,
  theme:      'dark',
}

// ─── Store interface ──────────────────────────────────────────────────────────
interface WorkspaceManagerState {
  // Active layout
  activeLayout:     SavedLayout | null
  savedLayouts:     SavedLayout[]

  // Floating windows
  floatingWidgets:  WidgetInstance[]

  // Fullscreen
  fullscreenId:     string | null

  // Add-widget panel
  addWidgetOpen:    boolean

  // Chart configs per instance
  chartConfigs:     Record<string, ChartConfig>

  // Save layout modal
  saveModalOpen:    boolean

  // Actions
  initWorkspace:    () => void
  loadPreset:       (presetId: string) => void
  loadLayout:       (layoutId: string) => void
  saveLayout:       (name: string) => void
  deleteLayout:     (layoutId: string) => void
  resetToDefault:   () => void

  updateWidgetLayout: (instanceId: string, updates: Partial<Pick<WidgetInstance, 'x'|'y'|'w'|'h'>>) => void
  removeWidget:       (instanceId: string) => void
  addWidget:          (widgetId: WidgetId, opts?: Partial<WidgetInstance>) => void
  toggleMinimize:     (instanceId: string) => void
  toggleMaximize:     (instanceId: string) => void
  toggleFloat:        (instanceId: string) => void
  updateFloatPos:     (instanceId: string, x: number, y: number) => void
  pinWidget:          (instanceId: string, pinned: boolean) => void

  setFullscreen:      (instanceId: string | null) => void
  setAddWidgetOpen:   (open: boolean) => void
  setSaveModalOpen:   (open: boolean) => void

  // Chart-specific
  updateChartConfig:  (instanceId: string, updates: Partial<ChartConfig>) => void
  getChartConfig:     (instanceId: string) => ChartConfig
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useWorkspaceManager = create<WorkspaceManagerState>((set, get) => ({
  activeLayout:    null,
  savedLayouts:    [],
  floatingWidgets: [],
  fullscreenId:    null,
  addWidgetOpen:   false,
  chartConfigs:    {},
  saveModalOpen:   false,

  initWorkspace: () => {
    const { layouts, activeId } = LayoutPersistenceService.load()
    const all = LayoutPersistenceService.getAllLayouts(layouts)

    let active = all.find(l => l.id === activeId) ?? all[0]
    if (!active) {
      // Fresh start — use first preset
      const preset = LAYOUT_PRESETS[0]
      active = LayoutPersistenceService.presetToSaved(preset)
    }

    // Ensure all widgets have instanceIds
    active = {
      ...active,
      widgets: active.widgets.map((w, i) => ({
        ...w,
        instanceId: w.instanceId || newInstanceId(w.widgetId),
      })),
    }

    set({ activeLayout: active, savedLayouts: layouts })
  },

  loadPreset: (presetId) => {
    const preset = LAYOUT_PRESETS.find(p => p.id === presetId)
    if (!preset) return
    const layout = LayoutPersistenceService.presetToSaved(preset)
    layout.widgets = layout.widgets.map(w => ({ ...w, instanceId: newInstanceId(w.widgetId) }))
    set({ activeLayout: layout, fullscreenId: null })
    const { savedLayouts } = get()
    LayoutPersistenceService.save(savedLayouts, layout.id)
  },

  loadLayout: (layoutId) => {
    const { savedLayouts } = get()
    const all = LayoutPersistenceService.getAllLayouts(savedLayouts)
    const layout = all.find(l => l.id === layoutId)
    if (!layout) return
    set({ activeLayout: layout, fullscreenId: null })
    LayoutPersistenceService.save(savedLayouts, layoutId)
  },

  saveLayout: (name) => {
    const { activeLayout, savedLayouts } = get()
    if (!activeLayout) return
    const newLayout: SavedLayout = {
      ...activeLayout,
      id:        `custom_${Date.now()}`,
      name,
      createdAt: Date.now(),
    }
    const next = [...savedLayouts, newLayout]
    set({ savedLayouts: next, activeLayout: newLayout, saveModalOpen: false })
    LayoutPersistenceService.save(next, newLayout.id)
  },

  deleteLayout: (layoutId) => {
    const { savedLayouts, activeLayout } = get()
    const next = savedLayouts.filter(l => l.id !== layoutId)
    set({ savedLayouts: next })
    LayoutPersistenceService.save(next, activeLayout?.id ?? null)
  },

  resetToDefault: () => {
    get().loadPreset(LAYOUT_PRESETS[0].id)
  },

  updateWidgetLayout: (instanceId, updates) => {
    set(s => {
      if (!s.activeLayout) return s
      return {
        activeLayout: {
          ...s.activeLayout,
          widgets: s.activeLayout.widgets.map(w =>
            w.instanceId === instanceId ? { ...w, ...updates } : w
          ),
        },
      }
    })
  },

  removeWidget: (instanceId) => {
    set(s => {
      if (!s.activeLayout) return s
      return {
        activeLayout: {
          ...s.activeLayout,
          widgets: s.activeLayout.widgets.filter(w => w.instanceId !== instanceId),
        },
        floatingWidgets: s.floatingWidgets.filter(w => w.instanceId !== instanceId),
      }
    })
  },

  addWidget: (widgetId, opts = {}) => {
    const def = WIDGET_REGISTRY[widgetId]
    if (!def) return
    const instanceId = newInstanceId(widgetId)
    const newWidget: WidgetInstance = {
      instanceId,
      widgetId,
      title:    opts.title    ?? def.label,
      symbol:   opts.symbol   ?? (widgetId === 'chart' ? 'EUR/USD' : undefined),
      timeframe:opts.timeframe ?? (widgetId === 'chart' ? 'M15' : undefined),
      x: 0, y: 0,
      w: def.defaultW, h: def.defaultH,
      minW: def.minW,  minH: def.minH,
      visible: true, minimized: false, maximized: false,
      pinned: false, floating: false,
      ...opts,
    }
    set(s => ({
      activeLayout: s.activeLayout ? {
        ...s.activeLayout,
        widgets: [...s.activeLayout.widgets, newWidget],
      } : s.activeLayout,
      addWidgetOpen: false,
    }))
  },

  toggleMinimize: (instanceId) => {
    set(s => ({
      activeLayout: s.activeLayout ? {
        ...s.activeLayout,
        widgets: s.activeLayout.widgets.map(w =>
          w.instanceId === instanceId ? { ...w, minimized: !w.minimized } : w
        ),
      } : s.activeLayout,
    }))
  },

  toggleMaximize: (instanceId) => {
    const current = get().activeLayout?.widgets.find(w => w.instanceId === instanceId)
    set(s => ({
      activeLayout: s.activeLayout ? {
        ...s.activeLayout,
        widgets: s.activeLayout.widgets.map(w =>
          w.instanceId === instanceId ? { ...w, maximized: !w.maximized } : w
        ),
      } : s.activeLayout,
      fullscreenId: current?.maximized ? null : instanceId,
    }))
  },

  toggleFloat: (instanceId) => {
    set(s => ({
      activeLayout: s.activeLayout ? {
        ...s.activeLayout,
        widgets: s.activeLayout.widgets.map(w =>
          w.instanceId === instanceId ? { ...w, floating: !w.floating, floatX: 100, floatY: 100, floatW: 600, floatH: 400 } : w
        ),
      } : s.activeLayout,
    }))
  },

  updateFloatPos: (instanceId, x, y) => {
    set(s => ({
      activeLayout: s.activeLayout ? {
        ...s.activeLayout,
        widgets: s.activeLayout.widgets.map(w =>
          w.instanceId === instanceId ? { ...w, floatX: x, floatY: y } : w
        ),
      } : s.activeLayout,
    }))
  },

  pinWidget: (instanceId, pinned) => {
    set(s => ({
      activeLayout: s.activeLayout ? {
        ...s.activeLayout,
        widgets: s.activeLayout.widgets.map(w =>
          w.instanceId === instanceId ? { ...w, pinned } : w
        ),
      } : s.activeLayout,
    }))
  },

  setFullscreen: (instanceId) => set({ fullscreenId: instanceId }),
  setAddWidgetOpen: (open) => set({ addWidgetOpen: open }),
  setSaveModalOpen: (open) => set({ saveModalOpen: open }),

  updateChartConfig: (instanceId, updates) => {
    set(s => ({
      chartConfigs: {
        ...s.chartConfigs,
        [instanceId]: { ...(s.chartConfigs[instanceId] ?? DEFAULT_CHART_CONFIG), ...updates },
      },
    }))
  },

  getChartConfig: (instanceId) => {
    const { chartConfigs, activeLayout } = get()
    if (chartConfigs[instanceId]) return chartConfigs[instanceId]
    // Try to get symbol/timeframe from widget instance
    const widget = activeLayout?.widgets.find(w => w.instanceId === instanceId)
    return {
      ...DEFAULT_CHART_CONFIG,
      symbol:    widget?.symbol    ?? 'EUR/USD',
      timeframe: widget?.timeframe ?? 'M15',
    }
  },
}))
