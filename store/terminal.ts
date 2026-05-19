import { create } from 'zustand'
import { PAIRS, WORKSPACE_TABS } from '@/lib/data'
import { tickPrice } from '@/lib/utils'
import type { CurrencyPair, TabId } from '@/types'

interface TerminalState {
  // Market
  pairs: CurrencyPair[]
  selectedPairIndex: number
  tickPrices: () => void
  selectPair: (index: number) => void

  // UI
  activeTab: TabId
  setActiveTab: (tab: TabId) => void

  // Squawk
  squawkEnabled: boolean
  toggleSquawk: () => void

  // Clock
  utcTime: string
  setUtcTime: (t: string) => void
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
  pairs: PAIRS.map(p => ({ ...p })),
  selectedPairIndex: 0,

  tickPrices: () => {
    set(state => ({
      pairs: state.pairs.map(p => {
        const newPrice = tickPrice(p.price, p.pip)
        const chg = newPrice - PAIRS.find(x => x.name === p.name)!.price
        return {
          ...p,
          price: newPrice,
          bid: newPrice - p.spread / 2,
          ask: newPrice + p.spread / 2,
          change: chg,
          changePct: (chg / PAIRS.find(x => x.name === p.name)!.price) * 100,
        }
      }),
    }))
  },

  selectPair: (index) => set({ selectedPairIndex: index }),

  activeTab: WORKSPACE_TABS[0].id,
  setActiveTab: (tab) => set({ activeTab: tab }),

  squawkEnabled: false,
  toggleSquawk: () => {
    const next = !get().squawkEnabled
    set({ squawkEnabled: next })
    if (next && typeof window !== 'undefined' && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(
        'Nexterm squawk activated. Federal Reserve Williams speaking. N F P release in two hours. Euro dollar at one point zero eight four.'
      )
      u.rate = 1.05
      window.speechSynthesis.speak(u)
    }
  },

  utcTime: '--:--:-- UTC',
  setUtcTime: (t) => set({ utcTime: t }),
}))
