import { useEffect } from 'react'
import { useTerminalStore } from '@/store/terminal'
import { getUTCTimeString } from '@/lib/utils'

export function useMarketTick(intervalMs = 900) {
  const tickPrices = useTerminalStore(s => s.tickPrices)
  const setUtcTime = useTerminalStore(s => s.setUtcTime)

  useEffect(() => {
    const id = setInterval(() => {
      tickPrices()
      setUtcTime(getUTCTimeString())
    }, intervalMs)
    setUtcTime(getUTCTimeString())
    return () => clearInterval(id)
  }, [tickPrices, setUtcTime, intervalMs])
}

export function useSelectedPair() {
  const pairs = useTerminalStore(s => s.pairs)
  const selectedPairIndex = useTerminalStore(s => s.selectedPairIndex)
  return pairs[selectedPairIndex]
}
