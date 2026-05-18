'use client'
import { useEffect, useRef } from 'react'
import { getWSClient } from '@/src/websocket/core/WSClient'
import { useMarketStore } from '@/src/features/market/store/marketStore'
import { useTerminalUIStore } from '@/src/features/terminal/store/terminalUIStore'
import { SUPPORTED_SYMBOLS, CLOCK_INTERVAL_MS } from '@/src/config'
import type { TickData } from '@/src/types'

function getUTCTime(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} UTC`
}

/**
 * Initializes the WebSocket connection exactly once.
 * Safe to call from multiple components — guards with a ref.
 */
export function useRealtimeMarket(): void {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const ws = getWSClient()

    // Connection status
    const offStatus = ws.onStatus(status => {
      useMarketStore.getState().setConnectionStatus(status)
    })

    // Tick handler
    const offTick = ws.on<TickData>('tick', msg => {
      if (msg.data) useMarketStore.getState().setTick(msg.data)
    })

    // Clock
    const clockId = setInterval(() => {
      useTerminalUIStore.getState().setUtcTime(getUTCTime())
    }, CLOCK_INTERVAL_MS)
    useTerminalUIStore.getState().setUtcTime(getUTCTime())

    // Connect and subscribe
    ws.connect()
    SUPPORTED_SYMBOLS.forEach(sym => ws.subscribe(sym))

    return () => {
      offStatus()
      offTick()
      clearInterval(clockId)
    }
  }, [])
}

/**
 * Returns the latest tick for a symbol, or null.
 * Stable reference — only re-renders when the specific symbol's tick changes.
 */
export function useSymbolTick(symbol: string): TickData | null {
  return useMarketStore(s => s.ticks[symbol] ?? null)
}

/**
 * Returns the current WebSocket connection status.
 */
export function useConnectionStatus() {
  return useMarketStore(s => s.connectionStatus)
}

/**
 * Returns the currently selected symbol.
 */
export function useSelectedSymbol(): string {
  return useMarketStore(s => s.selectedSymbol)
}
