import type { WSMessage, WSMessageType, ConnectionStatus } from '@/src/types'

// ─── Types ────────────────────────────────────────────────────────────────────
type Handler<T = unknown> = (msg: WSMessage<T>) => void
type StatusHandler        = (status: ConnectionStatus) => void
type Unsubscribe          = () => void

// ─── WebSocket Manager ────────────────────────────────────────────────────────
class WSCore {
  private ws:               WebSocket | null = null
  private readonly url:     string
  private handlers =        new Map<WSMessageType, Set<Handler>>()
  private statusHandlers =  new Set<StatusHandler>()
  private reconnectTimer:   ReturnType<typeof setTimeout>  | null = null
  private heartbeatTimer:   ReturnType<typeof setInterval> | null = null
  private reconnectDelay =  1_000
  private readonly maxDelay = 30_000
  private pendingSubs =     new Set<string>()
  private _status:          ConnectionStatus = 'disconnected'

  constructor(url: string) {
    this.url = url
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return
    this.setStatus('connecting')
    try {
      this.ws = new WebSocket(this.url)
      this.ws.onopen    = this.handleOpen
      this.ws.onmessage = this.handleMessage
      this.ws.onclose   = this.handleClose
      this.ws.onerror   = this.handleError
    } catch {
      this.scheduleReconnect()
    }
  }

  disconnect(): void {
    this.stopHeartbeat()
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null }
    this.ws?.close()
    this.ws = null
  }

  subscribe(symbol: string): void {
    this.pendingSubs.add(symbol)
    this.send({ type: 'subscribe', symbol, ts: Date.now() })
  }

  unsubscribe(symbol: string): void {
    this.pendingSubs.delete(symbol)
    this.send({ type: 'unsubscribe', symbol, ts: Date.now() })
  }

  on<T = unknown>(type: WSMessageType, handler: Handler<T>): Unsubscribe {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set())
    this.handlers.get(type)!.add(handler as Handler)
    return () => this.handlers.get(type)?.delete(handler as Handler)
  }

  onStatus(handler: StatusHandler): Unsubscribe {
    this.statusHandlers.add(handler)
    handler(this._status)
    return () => this.statusHandlers.delete(handler)
  }

  get status(): ConnectionStatus { return this._status }

  // ── Private ────────────────────────────────────────────────────────────────
  private send(msg: Partial<WSMessage>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  private handleOpen = (): void => {
    this.reconnectDelay = 1_000
    this.setStatus('connected')
    this.startHeartbeat()
    this.pendingSubs.forEach(sym => this.send({ type: 'subscribe', symbol: sym, ts: Date.now() }))
  }

  private handleMessage = (event: MessageEvent): void => {
    try {
      const msg = JSON.parse(event.data) as WSMessage
      this.handlers.get(msg.type)?.forEach(h => h(msg))
    } catch { /* ignore malformed */ }
  }

  private handleClose = (): void => {
    this.stopHeartbeat()
    this.setStatus('disconnected')
    this.scheduleReconnect()
  }

  private handleError = (): void => {
    this.setStatus('error')
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxDelay)
      this.connect()
    }, this.reconnectDelay)
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'heartbeat', ts: Date.now() })
    }, 15_000)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) { clearInterval(this.heartbeatTimer); this.heartbeatTimer = null }
  }

  private setStatus(s: ConnectionStatus): void {
    this._status = s
    this.statusHandlers.forEach(h => h(s))
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────
let instance: WSCore | null = null

export function getWSClient(): WSCore {
  if (!instance) {
    const url = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3001/ws'
    instance = new WSCore(url)
  }
  return instance
}

export type { WSCore }
