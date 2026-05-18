import Fastify from 'fastify'
import FastifyWS from '@fastify/websocket'
import FastifyCors from '@fastify/cors'
import { WebSocket } from 'ws'

// ─── Types (inlined to avoid import issues in standalone server) ──────────────
interface TickData {
  symbol: string
  bid: number
  ask: number
  price: number
  change: number
  changePct: number
  ts: number
}

interface WSMsg {
  type: string
  symbol?: string
  data?: unknown
  ts: number
}

// ─── In-memory price cache (simulated; replace with real API in prod) ─────────
const BASE_PRICES: Record<string, number> = {
  'EUR/USD': 1.08432,
  'GBP/USD': 1.26815,
  'USD/JPY': 149.284,
  'AUD/USD': 0.64892,
  'NZD/USD': 0.59341,
  'USD/CAD': 1.36218,
  'USD/CHF': 0.89743,
  'EUR/GBP': 0.85541,
  'DXY':     104.320,
}

const SPREADS: Record<string, number> = {
  'EUR/USD': 0.00014, 'GBP/USD': 0.00018, 'USD/JPY': 0.012,
  'AUD/USD': 0.00017, 'NZD/USD': 0.00020, 'USD/CAD': 0.00018,
  'USD/CHF': 0.00016, 'EUR/GBP': 0.00015, 'DXY':     0.002,
}

const PIPS: Record<string, number> = {
  'EUR/USD': 0.0001, 'GBP/USD': 0.0001, 'USD/JPY': 0.01,
  'AUD/USD': 0.0001, 'NZD/USD': 0.0001, 'USD/CAD': 0.0001,
  'USD/CHF': 0.0001, 'EUR/GBP': 0.0001, 'DXY':     0.001,
}

const prices: Record<string, number> = { ...BASE_PRICES }

function tickPrice(symbol: string) {
  const pip = PIPS[symbol] ?? 0.0001
  const chg = (Math.random() - 0.495) * pip * 2.5
  prices[symbol] = Math.max((prices[symbol] ?? 1) + chg, pip * 5)
}

function getTickData(symbol: string): TickData {
  const price = prices[symbol]
  const spread = SPREADS[symbol] ?? 0.0001
  const base = BASE_PRICES[symbol] ?? price
  const change = price - base
  return {
    symbol,
    price,
    bid: price - spread / 2,
    ask: price + spread / 2,
    change,
    changePct: (change / base) * 100,
    ts: Date.now(),
  }
}

// ─── Client registry ─────────────────────────────────────────────────────────
const clients = new Map<WebSocket, Set<string>>()

function broadcast(symbol: string, data: TickData) {
  const msg = JSON.stringify({ type: 'tick', symbol, data, ts: Date.now() })
  clients.forEach((subs, ws) => {
    if (subs.has(symbol) && ws.readyState === WebSocket.OPEN) {
      ws.send(msg)
    }
  })
}

function broadcastAll() {
  const activeSymbols = new Set<string>()
  clients.forEach(subs => subs.forEach(s => activeSymbols.add(s)))

  activeSymbols.forEach(symbol => {
    tickPrice(symbol)
    broadcast(symbol, getTickData(symbol))
  })
}

// ─── Batch updates every 800ms ────────────────────────────────────────────────
setInterval(broadcastAll, 800)

// ─── Fastify server ───────────────────────────────────────────────────────────
const app = Fastify({ logger: false })

app.register(FastifyCors, { origin: true })
app.register(FastifyWS)

app.register(async (fastify) => {
  fastify.get('/ws', { websocket: true }, (socket) => {
    clients.set(socket, new Set())
    console.log(`[WS] Client connected. Total: ${clients.size}`)

    // Send connected + all current prices
    socket.send(JSON.stringify({ type: 'connected', ts: Date.now() }))
    Object.keys(prices).forEach(symbol => {
      socket.send(JSON.stringify({
        type: 'tick', symbol,
        data: getTickData(symbol),
        ts: Date.now(),
      }))
    })

    socket.on('message', (raw: Buffer) => {
      try {
        const msg: WSMsg = JSON.parse(raw.toString())
        const subs = clients.get(socket)!

        if (msg.type === 'subscribe' && msg.symbol) {
          subs.add(msg.symbol)
          socket.send(JSON.stringify({
            type: 'tick', symbol: msg.symbol,
            data: getTickData(msg.symbol),
            ts: Date.now(),
          }))
        }

        if (msg.type === 'unsubscribe' && msg.symbol) {
          subs.delete(msg.symbol)
        }

        if (msg.type === 'heartbeat') {
          socket.send(JSON.stringify({ type: 'heartbeat', ts: Date.now() }))
        }
      } catch { /* ignore */ }
    })

    socket.on('close', () => {
      clients.delete(socket)
      console.log(`[WS] Client disconnected. Total: ${clients.size}`)
    })
  })
})

// REST: snapshot endpoint
app.get('/api/snapshot', async () => {
  return Object.keys(prices).reduce((acc, sym) => {
    acc[sym] = getTickData(sym)
    return acc
  }, {} as Record<string, TickData>)
})

app.get('/health', async () => ({ status: 'ok', clients: clients.size, ts: Date.now() }))

const PORT = parseInt(process.env.WS_PORT ?? '3001')
app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) { console.error(err); process.exit(1) }
  console.log(`[NEXTERM] WS server running on :${PORT}`)
})
