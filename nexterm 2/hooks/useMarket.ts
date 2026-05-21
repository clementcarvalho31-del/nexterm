// Legacy exports — now powered by realtime WS
export { useRealtimeMarket, useSymbolTick, useConnectionStatus } from './useRealtimeMarket'

import { useTerminalStore } from '@/store/terminal'
import { PAIRS } from '@/lib/data'
import type { TickData } from '@/types'

export function useSelectedPair(): TickData {
  const symbol = useTerminalStore(s => s.selectedSymbol)
  const ticks  = useTerminalStore(s => s.ticks)
  const pair   = PAIRS.find(p => p.name === symbol) ?? PAIRS[0]
  return ticks[symbol] ?? {
    symbol: pair.name, price: pair.price, bid: pair.bid, ask: pair.ask,
    change: pair.change, changePct: pair.changePct, ts: Date.now(),
  }
}
