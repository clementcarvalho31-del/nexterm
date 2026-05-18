import { create } from 'zustand'
import type { TabId } from '@/src/types'

interface TerminalUIState {
  activeTab:     TabId
  commandOpen:   boolean
  squawkEnabled: boolean
  utcTime:       string

  setActiveTab:     (tab: TabId) => void
  setCommandOpen:   (open: boolean) => void
  toggleSquawk:     () => void
  setUtcTime:       (time: string) => void
}

export const useTerminalUIStore = create<TerminalUIState>((set, get) => ({
  activeTab:     'dashboard',
  commandOpen:   false,
  squawkEnabled: false,
  utcTime:       '--:--:-- UTC',

  setActiveTab:   (tab)  => set({ activeTab: tab }),
  setCommandOpen: (open) => set({ commandOpen: open }),
  setUtcTime:     (time) => set({ utcTime: time }),

  toggleSquawk: () => {
    const next = !get().squawkEnabled
    set({ squawkEnabled: next })
    if (next && typeof window !== 'undefined' && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance('Nexterm squawk activated.')
      u.rate = 1.05
      window.speechSynthesis.speak(u)
    } else {
      window.speechSynthesis?.cancel()
    }
  },
}))
