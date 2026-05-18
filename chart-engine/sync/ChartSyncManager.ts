import { create } from 'zustand'
import type { Timeframe, ChartThemeId, IndicatorConfig, ChartTemplate } from '../types'

// ─── Sync groups ──────────────────────────────────────────────────────────────
interface SyncGroup {
  id:        string
  symbol?:   string
  timeframe?: Timeframe
  members:   Set<string>   // instanceIds
}

// ─── Chart instance state ─────────────────────────────────────────────────────
export interface ChartInstanceState {
  instanceId:   string
  symbol:       string
  timeframe:    Timeframe
  themeId:      ChartThemeId
  engine:       'klinecharts' | 'tradingview'
  showVolume:   boolean
  indicators:   IndicatorConfig[]
  linked:       boolean
  linkedGroup:  string
  isMaximized:  boolean
  isFloating:   boolean
}

// ─── Global chart manager store ───────────────────────────────────────────────
interface ChartManagerState {
  instances:       Record<string, ChartInstanceState>
  syncGroups:      Record<string, SyncGroup>
  activeInstanceId: string | null
  globalTheme:     ChartThemeId
  templates:       ChartTemplate[]

  // Instance CRUD
  registerInstance:   (id: string, initial: Partial<ChartInstanceState>) => void
  unregisterInstance: (id: string) => void
  setActiveInstance:  (id: string | null) => void

  // Per-instance updates
  updateSymbol:    (id: string, symbol: string)     => void
  updateTimeframe: (id: string, tf: Timeframe)      => void
  updateTheme:     (id: string, theme: ChartThemeId) => void
  addIndicator:    (id: string, ind: IndicatorConfig) => void
  removeIndicator: (id: string, indId: string)       => void
  toggleVolume:    (id: string)                       => void
  toggleLinked:    (id: string)                       => void

  // Sync groups
  addToGroup:      (instanceId: string, groupId: string) => void
  removeFromGroup: (instanceId: string)                   => void
  syncGroupSymbol: (groupId: string, symbol: string, sourceId: string)   => void
  syncGroupTF:     (groupId: string, tf: Timeframe, sourceId: string)    => void

  // Global
  setGlobalTheme:    (theme: ChartThemeId) => void
  saveTemplate:      (name: string, instanceId: string) => void
  applyTemplate:     (templateId: string, instanceId: string) => void
  deleteTemplate:    (templateId: string) => void
}

let idCounter = 0

const DEFAULT_INSTANCE: ChartInstanceState = {
  instanceId:  '',
  symbol:      'EUR/USD',
  timeframe:   'M15',
  themeId:     'dark-terminal',
  engine:      'klinecharts',
  showVolume:  true,
  indicators:  [],
  linked:      true,
  linkedGroup: 'default',
  isMaximized: false,
  isFloating:  false,
}

export const useChartManager = create<ChartManagerState>((set, get) => ({
  instances:        {},
  syncGroups:       { default: { id: 'default', members: new Set() } },
  activeInstanceId: null,
  globalTheme:      'dark-terminal',
  templates:        [],

  registerInstance: (id, initial) => {
    const inst: ChartInstanceState = { ...DEFAULT_INSTANCE, instanceId: id, ...initial }
    set(s => ({ instances: { ...s.instances, [id]: inst } }))
    if (inst.linked) get().addToGroup(id, inst.linkedGroup)
  },

  unregisterInstance: (id) => {
    get().removeFromGroup(id)
    set(s => {
      const { [id]: _, ...rest } = s.instances
      return { instances: rest, activeInstanceId: s.activeInstanceId === id ? null : s.activeInstanceId }
    })
  },

  setActiveInstance: (id) => set({ activeInstanceId: id }),

  updateSymbol: (id, symbol) => {
    set(s => ({ instances: { ...s.instances, [id]: { ...s.instances[id], symbol } } }))
    // Sync group
    const inst = get().instances[id]
    if (inst?.linked) get().syncGroupSymbol(inst.linkedGroup, symbol, id)
  },

  updateTimeframe: (id, tf) => {
    set(s => ({ instances: { ...s.instances, [id]: { ...s.instances[id], timeframe: tf } } }))
    const inst = get().instances[id]
    if (inst?.linked) get().syncGroupTF(inst.linkedGroup, tf, id)
  },

  updateTheme: (id, theme) => {
    set(s => ({ instances: { ...s.instances, [id]: { ...s.instances[id], themeId: theme } } }))
  },

  addIndicator: (id, ind) => {
    set(s => ({
      instances: { ...s.instances, [id]: {
        ...s.instances[id],
        indicators: [...(s.instances[id]?.indicators ?? []), ind],
      }},
    }))
  },

  removeIndicator: (id, indId) => {
    set(s => ({
      instances: { ...s.instances, [id]: {
        ...s.instances[id],
        indicators: s.instances[id]?.indicators.filter(i => i.id !== indId) ?? [],
      }},
    }))
  },

  toggleVolume: (id) => {
    set(s => ({ instances: { ...s.instances, [id]: { ...s.instances[id], showVolume: !s.instances[id]?.showVolume } } }))
  },

  toggleLinked: (id) => {
    const inst = get().instances[id]
    if (!inst) return
    if (inst.linked) {
      get().removeFromGroup(id)
      set(s => ({ instances: { ...s.instances, [id]: { ...s.instances[id], linked: false } } }))
    } else {
      set(s => ({ instances: { ...s.instances, [id]: { ...s.instances[id], linked: true } } }))
      get().addToGroup(id, inst.linkedGroup)
    }
  },

  addToGroup: (instanceId, groupId) => {
    set(s => {
      const groups = { ...s.syncGroups }
      if (!groups[groupId]) groups[groupId] = { id: groupId, members: new Set() }
      const g = { ...groups[groupId], members: new Set([...groups[groupId].members, instanceId]) }
      return { syncGroups: { ...groups, [groupId]: g } }
    })
  },

  removeFromGroup: (instanceId) => {
    set(s => {
      const groups: Record<string, SyncGroup> = {}
      for (const [gid, group] of Object.entries(s.syncGroups)) {
        const members = new Set([...group.members].filter(m => m !== instanceId))
        groups[gid] = { ...group, members }
      }
      return { syncGroups: groups }
    })
  },

  syncGroupSymbol: (groupId, symbol, sourceId) => {
    const { syncGroups, instances } = get()
    const group = syncGroups[groupId]
    if (!group) return
    const updates: Record<string, ChartInstanceState> = { ...instances }
    group.members.forEach(memberId => {
      if (memberId !== sourceId && instances[memberId]) {
        updates[memberId] = { ...instances[memberId], symbol }
      }
    })
    set({ instances: updates })
  },

  syncGroupTF: (groupId, tf, sourceId) => {
    const { syncGroups, instances } = get()
    const group = syncGroups[groupId]
    if (!group) return
    const updates: Record<string, ChartInstanceState> = { ...instances }
    group.members.forEach(memberId => {
      if (memberId !== sourceId && instances[memberId]) {
        updates[memberId] = { ...instances[memberId], timeframe: tf }
      }
    })
    set({ instances: updates })
  },

  setGlobalTheme: (theme) => {
    set(s => ({
      globalTheme: theme,
      instances: Object.fromEntries(
        Object.entries(s.instances).map(([id, inst]) => [id, { ...inst, themeId: theme }])
      ),
    }))
  },

  saveTemplate: (name, instanceId) => {
    const inst = get().instances[instanceId]
    if (!inst) return
    const template: ChartTemplate = {
      id:        `tpl_${Date.now()}`,
      name,
      createdAt: Date.now(),
      theme:     inst.themeId,
      indicators: inst.indicators.map(({ id: _, ...rest }) => rest),
      showVolume: inst.showVolume,
    }
    set(s => ({ templates: [...s.templates, template] }))
    // Persist
    if (typeof localStorage !== 'undefined') {
      try { localStorage.setItem('nexterm_chart_templates', JSON.stringify(get().templates)) } catch {}
    }
  },

  applyTemplate: (templateId, instanceId) => {
    const { templates, instances } = get()
    const tpl = templates.find(t => t.id === templateId)
    const inst = instances[instanceId]
    if (!tpl || !inst) return
    let counter = 0
    const indicators = tpl.indicators.map(ind => ({ ...ind, id: `ind_${Date.now()}_${++counter}` }))
    set(s => ({
      instances: { ...s.instances, [instanceId]: {
        ...inst, themeId: tpl.theme, indicators, showVolume: tpl.showVolume,
      }},
    }))
  },

  deleteTemplate: (templateId) => {
    set(s => ({ templates: s.templates.filter(t => t.id !== templateId) }))
  },
}))
