'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useTerminalStore } from '@/store/terminal'
import { NEWS_FEED, CALENDAR_EVENTS, PAIR_BIASES, COT_DATA } from '@/lib/data'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
  ts: number
}

const QUICK_PROMPTS = [
  'Summarize macro session',
  'Explain EUR/USD move',
  'NFP trading scenarios',
  'COT positioning signals',
]

export function AICopilot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'NEXTERM AI Copilot ready. I have access to live market data, news feed, COT positioning, and macro calendar. Ask me anything.',
      ts: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const ticks   = useTerminalStore(s => s.ticks)
  const activeTab = useTerminalStore(s => s.activeTab)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const buildContext = useCallback(() => {
    const tickLines = Object.values(ticks).slice(0, 6).map(t =>
      `${t.symbol}: ${t.price.toFixed(5)} (${t.changePct >= 0 ? '+' : ''}${t.changePct.toFixed(2)}%)`
    ).join('\n')

    const newsLines = NEWS_FEED.slice(0, 5).map(n =>
      `[${n.impact.toUpperCase()}][${n.tag}] ${n.title}`
    ).join('\n')

    const calLines = CALENDAR_EVENTS.filter(e => e.impact === 'high').map(e =>
      `${e.time} ${e.flag} ${e.event} — Forecast: ${e.forecast}`
    ).join('\n')

    const cotLines = COT_DATA.slice(0, 4).map(c =>
      `${c.pair}: Net ${c.net > 0 ? '+' : ''}${(c.net / 1000).toFixed(1)}K (${c.direction === 'up' ? 'LONG' : 'SHORT'} bias)`
    ).join('\n')

    return `You are NEXTERM AI Copilot, an institutional FX terminal assistant.

LIVE PRICES:
${tickLines || 'No live data'}

BREAKING NEWS:
${newsLines}

HIGH-IMPACT CALENDAR TODAY:
${calLines}

COT POSITIONING:
${cotLines}

Active terminal tab: ${activeTab}

Rules:
- Be concise, analytical, institutional tone
- Use FX trader language
- Reference actual data above when relevant
- Format key levels, scenarios, and bias clearly
- Never fabricate data not present above`
  }, [ticks, activeTab])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || loading) return

    const userMsg: Message = { role: 'user', content, ts: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const context = buildContext()
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          systemContext: context,
        }),
      })

      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.content, ts: Date.now() }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connection error. Check API configuration.',
        ts: Date.now(),
      }])
    } finally {
      setLoading(false)
    }
  }, [loading, messages, buildContext])

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* Quick prompts */}
      <div className="flex gap-1 p-2 border-b border-[#1e2530] flex-wrap flex-shrink-0">
        {QUICK_PROMPTS.map(p => (
          <button
            key={p}
            onClick={() => sendMessage(p)}
            className="px-2 py-0.5 text-[8px] border border-[#2a3444] text-[#8a9ab0] rounded-sm cursor-pointer hover:border-[#f0b429] hover:text-[#f0b429] bg-transparent transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn(
              'max-w-[85%] px-2 py-1.5 rounded-sm text-[10px] leading-relaxed',
              msg.role === 'user'
                ? 'bg-[#131821] border border-[#2a3444] text-[#e2e8f0]'
                : 'bg-[#0f1520] border border-[#1e2530] text-[#c8cdd6]'
            )}>
              {msg.role === 'assistant' && (
                <span className="text-[8px] text-[#f0b429] block mb-1">AI COPILOT</span>
              )}
              <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex">
            <div className="bg-[#0f1520] border border-[#1e2530] px-2 py-1.5 rounded-sm">
              <span className="text-[8px] text-[#f0b429]">AI COPILOT</span>
              <div className="flex gap-1 mt-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1 h-1 rounded-full bg-[#5a6373] animate-pulse2" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 p-2 border-t border-[#1e2530] flex-shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder="Ask about FX, macro, scenarios..."
          className="flex-1 bg-[#0a0c0f] border border-[#2a3444] text-[#e2e8f0] text-[10px] px-2 py-1.5 rounded-sm outline-none placeholder-[#3d4a5a] focus:border-[#f0b429]"
          style={{ fontFamily: 'inherit' }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="px-3 py-1 bg-[#f0b429] text-[#0a0c0f] text-[9px] font-bold rounded-sm cursor-pointer disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          SEND
        </button>
      </div>
    </div>
  )
}
