import type { WSMessage, WSMessageType, TickData, CandleData, ConnectionStatus } from '@/types'

type MessageHandler<T = unknown> = (msg: WSMessage<T>) => void
type StatusHandler = (status: ConnectionStatus) => void

class WebSocketManager {
  private ws: WebSocket | null = null
  private url: string
  private handlers = new Map<WSMessageType, Set<MessageHandler>>()
  private statusHandlers = new Set<StatusHandler>()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private reconnectDelay = 1000
  private maxReconnectDelay = 30000
  private pendingSubscriptions = new Set<string>()
  private status: ConnectionStatus = 'disconnected'

  constructor(url: string) {
    this.url = url
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return
    this.setStatus('connecting')

    try {
      this.ws = new WebSocket(this.url)
      this.ws.onopen    = this.onOpen
      this.ws.onmessage = this.onMessage
      this.ws.onclose   = this.onClose
      this.ws.onerror   = this.onError
    } catch {
      this.scheduleReconnect()
    }
  }

  private onOpen = () => {
    this.reconnectDelay = 1000
    this.setStatus('connected')
    this.startHeartbeat()
    this.pendingSubscriptions.forEach(sym => this.subscribeSymbol(sym))
  }

  private onMessage = (event: MessageEvent) => {
    try {
      const msg: WSMessage = JSON.parse(event.data)
      this.handlers.get(msg.type)?.forEach(h => h(msg))
    } catch { /* ignore malformed */ }
  }

  private onClose = () => {
    this.stopHeartbeat()
    this.setStatus('disconnected')
    this.scheduleReconnect()
  }

  private onError = () => {
    this.setStatus('error')
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay)
      this.connect()
    }, this.reconnectDelay)
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'heartbeat', ts: Date.now() })
    }, 15000)
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private setStatus(s: ConnectionStatus) {
    this.status = s
    this.statusHandlers.forEach(h => h(s))
  }

  send(msg: Partial<WSMessage>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ ...msg, ts: Date.now() }))
    }
  }

  subscribeSymbol(symbol: string) {
    this.pendingSubscriptions.add(symbol)
    this.send({ type: 'subscribe', symbol, data: { channel: 'ticks' } })
  }

  unsubscribeSymbol(symbol: string) {
    this.pendingSubscriptions.delete(symbol)
    this.send({ type: 'unsubscribe', symbol })
  }

  on<T = unknown>(type: WSMessageType, handler: MessageHandler<T>) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set())
    this.handlers.get(type)!.add(handler as MessageHandler)
    return () => this.handlers.get(type)?.delete(handler as MessageHandler)
  }

  onStatus(handler: StatusHandler) {
    this.statusHandlers.add(handler)
    handler(this.status)
    return () => this.statusHandlers.delete(handler)
  }

  disconnect() {
    this.stopHeartbeat()
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws?.close()
    this.ws = null
  }

  getStatus() { return this.status }
}

// Singleton — one connection per app
let instance: WebSocketManager | null = null

export function getWSManager(): WebSocketManager {
  if (!instance) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3001/ws'
    instance = new WebSocketManager(wsUrl)
  }
  return instance
}
