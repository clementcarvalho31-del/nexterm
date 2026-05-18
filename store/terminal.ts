// Migration shim — stores split into feature modules
// Market data: src/features/market/store/marketStore.ts  
// Terminal UI: src/features/terminal/store/terminalUIStore.ts

import { create } from 'zustand'
import type { TickData, ConnectionStatus, TabId } from '@/src/types'
import { WORKSPACE_TABS } from '@/lib/data'

// ── Legacy unified store (kept for backward compat with older components) ──
export interface TerminalStore {
  ticks: Record<string, TickData>
  selectedSymbol: string
  setTick: (tick: TickData) => void
  setSelectedSymbol: (s: string) => void
  activeTab: TabId
  setActiveTab: (t: TabId) => void
  commandOpen: boolean
  setCommandOpen: (v: boolean) => void
  utcTime: string
  setUtcTime: (t: string) => void
  status: ConnectionStatus
  setStatus: (s: ConnectionStatus) => void
  squawkEnabled: boolean
  toggleSquawk: () => void
}

export const useTerminalStore = create<TerminalStore>((set, get) => ({
  ticks: {},
  selectedSymbol: 'EUR/USD',
  setTick: (tick) => set(s => ({ ticks: { ...s.ticks, [tick.symbol]: tick } })),
  setSelectedSymbol: (s) => set({ selectedSymbol: s }),
  activeTab: WORKSPACE_TABS[0].id,
  setActiveTab: (tab) => set({ activeTab: tab }),
  commandOpen: false,
  setCommandOpen: (v) => set({ commandOpen: v }),
  utcTime: '--:--:-- UTC',
  setUtcTime: (t) => set({ utcTime: t }),
  status: 'disconnected',
  setStatus: (s) => set({ status: s }),
  squawkEnabled: false,
  toggleSquawk: () => {
    const next = !get().squawkEnabled
    set({ squawkEnabled: next })
    if (next && typeof window !== 'undefined' && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance('Nexterm squawk activated.')
      u.rate = 1.05
      window.speechSynthesis.speak(u)
    }
  },
}))

// New clean selectors for new components
export const selectAllTicks = (s: TerminalStore) => s.ticks
