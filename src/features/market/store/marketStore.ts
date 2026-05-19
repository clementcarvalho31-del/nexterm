import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { TickData, ConnectionStatus } from '@/src/types'
import { SUPPORTED_SYMBOLS } from '@/src/config'

interface MarketState {
  ticks:           Record<string, TickData>
  selectedSymbol:  string
  connectionStatus: ConnectionStatus

  // Actions
  setTick:           (tick: TickData) => void
  setTicks:          (ticks: Record<string, TickData>) => void
  selectSymbol:      (symbol: string) => void
  setConnectionStatus: (status: ConnectionStatus) => void
}

export const useMarketStore = create<MarketState>()(
  subscribeWithSelector((set) => ({
    ticks:            {},
    selectedSymbol:   'EUR/USD',
    connectionStatus: 'disconnected',

    setTick: (tick) =>
      set(s => ({ ticks: { ...s.ticks, [tick.symbol]: tick } })),

    setTicks: (ticks) => set({ ticks }),

    selectSymbol: (symbol) => set({ selectedSymbol: symbol }),

    setConnectionStatus: (status) => set({ connectionStatus: status }),
  }))
)

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectTick     = (symbol: string) => (s: MarketState) => s.ticks[symbol]
export const selectAllTicks = (s: MarketState) => s.ticks
export const selectSymbol   = (s: MarketState) => s.selectedSymbol
export const selectStatus   = (s: MarketState) => s.connectionStatus
