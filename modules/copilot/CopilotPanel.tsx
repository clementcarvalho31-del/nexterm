'use client'
import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { useTerminalStore } from '@/store/terminal'
import { NEWS_FEED, CALENDAR_EVENTS, COT_DATA, PAIR_BIASES } from '@/lib/data'

interface Message { role: 'user' | 'assistant'; content: string; ts: number }

const QUICK_PROMPTS = [
  'Session brief',
  'EUR/USD outlook',
  'NFP scenarios',
  'COT signals',
  'Gold analysis',
  'Yield curve impact',
]

// Canned responses for demo / offline mode
const CANNED: Record<string, string> = {
  'Session brief': `SESSION BRIEF — ${new Date().toUTCString().slice(17, 22)} UTC\n\nUSD mixed ahead of NFP. EUR/USD holding 1.0843 support. GBP outperforms on CPI beat. Gold bid on geopolitical + real yields falling.\n\nKey risk: NFP in ~2h. COT net long EUR +24K — institutional positioning supportive. Reduce size until data clears.`,
  'EUR/USD outlook': `EUR/USD — Bullish bias (72% conf)\n\nSupport: 1.0810 (S1) | Resist: 1.0870 (R1)\nEMA20 > EMA50 — uptrend intact\nCOT net long +24K contracts\n\nECB Jun cut partially priced. Risk: NFP beat above 200K flips bias bearish. Bull target 1.0900 on miss.`,
  'NFP scenarios': `NFP SCENARIOS — 14:30 UTC\n\nBULL (>200K, wages ≤0.3%):\nUSD rallies → EUR/USD to 1.0780-1.0810\nShort EUR/USD on 1.0870 fail\n\nBEAR (<150K, wages ≥0.4%):\nEUR/USD squeeze to 1.0870-1.0900\nGold +$15-20\n\nBASE (150-200K in-line):\n20-30 pip whipsaw → fade initial move\n1.0843 pivot level to watch`,
  'COT signals': `COT — WEEK OF MAY 7\n\nEUR net long: +24,300 (+3.2K wk)\nGBP net long: +18,700 (+1.1K wk)\nJPY net short: -62,400 ← EXTREME\nAUD net short: -8,200\n\nSignal: Institutional preference for long EUR, long GBP, bearish USD/JPY. JPY shorts at extreme = squeeze risk. Aligned with DXY weakness thesis.`,
  'Gold analysis': `GOLD — $2318 (+0.54%)\n\nCB accumulation confirmed\nReal yields falling = bullish\nGeopolitical premium intact\n\nSeasonality: May historically +0.4% avg\nCOT: not extreme long — room to run\n\nKey levels: R1 $2335 | S1 $2290\nWatch: DXY correlation (-0.82)\nIf NFP miss → target $2350`,
  'Yield curve impact': `YIELD CURVE ANALYSIS\n\n2Y-10Y spread: -0.46% (inverted)\nSignal: Recession probability elevated\n\nFX impact:\n• Inversion = USD headwind long-term\n• Short-end (2Y) 4.87% = carry supports USD near-term\n• Steepening = risk-on, EUR/USD bullish\n\nCurrent: Fed on hold, curve normalising slowly. Watch 2Y break below 4.70% for EUR rally signal.`,
}

const MsgBubble = memo(function MsgBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
      <div style={{
        maxWidth: '86%', padding: '7px 10px', borderRadius: 2, fontSize: 10, lineHeight: 1.55,
        background: isUser ? '#131821' : '#0f1520',
        border: `0.5px solid ${isUser ? '#2a3444' : '#1e2530'}`,
        color: isUser ? '#e2e8f0' : '#c8cdd6',
        whiteSpace: 'pre-wrap',
      }}>
        {!isUser && (
          <span style={{ fontSize: 8, color: '#f0b429', display: 'block', marginBottom: 3, fontWeight: 700 }}>
            AI COPILOT
          </span>
        )}
        {msg.content}
      </div>
    </div>
  )
})

export function CopilotPanel() {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: 'NEXTERM AI Copilot ready.\n\nI have access to live prices, news feed, COT positioning, calendar, and session data. Ask me anything about the market.',
    ts: Date.now(),
  }])
  const [input, setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const ticks     = useTerminalStore(s => s.ticks)
  const activeTab = useTerminalStore(s => s.activeTab)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const buildContext = useCallback(() => {
    const priceLines = Object.values(ticks).slice(0, 6)
      .map(t => `${t.symbol}: ${t.price.toFixed(5)} (${t.changePct >= 0 ? '+' : ''}${t.changePct.toFixed(2)}%)`)
      .join('\n')
    const newsLines = NEWS_FEED.slice(0, 5)
      .map(n => `[${n.impact.toUpperCase()}][${n.tag}] ${n.title}`)
      .join('\n')
    const calLines = CALENDAR_EVENTS.filter(e => e.impact === 'high')
      .map(e => `${e.time} ${e.event} — Forecast: ${e.forecast}`)
      .join('\n')
    const cotLines = COT_DATA.slice(0, 4)
      .map(c => `${c.pair}: Net ${c.net > 0 ? '+' : ''}${(c.net / 1000).toFixed(1)}K (${c.direction === 'up' ? 'LONG' : 'SHORT'})`)
      .join('\n')
    return `You are NEXTERM AI Copilot — an institutional FX terminal assistant.\n\nLIVE PRICES:\n${priceLines || 'No data'}\n\nBREAKING NEWS:\n${newsLines}\n\nHIGH-IMPACT CALENDAR:\n${calLines}\n\nCOT POSITIONING:\n${cotLines}\n\nActive module: ${activeTab}\n\nBe concise, analytical, institutional tone. Use FX trader language. Reference actual data above. Format key levels clearly. Max 120 words.`
  }, [ticks, activeTab])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', content: text, ts: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // Check canned first
    const canned = CANNED[text]
    if (canned) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: canned, ts: Date.now() }])
        setLoading(false)
      }, 400)
      return
    }

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          systemContext: buildContext(),
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.content, ts: Date.now() }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'API not configured. Add ANTHROPIC_API_KEY to .env.local to enable live AI responses.',
        ts: Date.now(),
      }])
    } finally {
      setLoading(false)
    }
  }, [loading, messages, buildContext])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0c0f' }}>
      {/* Quick prompts */}
      <div style={{ display: 'flex', gap: 4, padding: '6px 10px', borderBottom: '0.5px solid #1e2530', flexShrink: 0, flexWrap: 'wrap' }}>
        {QUICK_PROMPTS.map(p => (
          <button
            key={p}
            onClick={() => sendMessage(p)}
            disabled={loading}
            style={{
              padding: '2px 8px', fontSize: 8, border: '0.5px solid #2a3444', color: '#8a9ab0',
              borderRadius: 2, cursor: 'pointer', background: 'transparent', fontFamily: 'inherit',
              transition: 'all 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#f0b429'; e.currentTarget.style.color = '#f0b429' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a3444'; e.currentTarget.style.color = '#8a9ab0' }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 4px' }}>
        {messages.map((msg, i) => <MsgBubble key={i} msg={msg} />)}
        {loading && (
          <div style={{ display: 'flex' }}>
            <div style={{ background: '#0f1520', border: '0.5px solid #1e2530', padding: '7px 10px', borderRadius: 2 }}>
              <span style={{ fontSize: 8, color: '#f0b429', display: 'block', marginBottom: 4, fontWeight: 700 }}>AI COPILOT</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 5, height: 5, borderRadius: '50%', background: '#5a6373',
                    animation: 'pulse 1.4s ease-in-out infinite',
                    animationDelay: `${i * 0.2}s`,
                  }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 6, padding: '8px 10px', borderTop: '0.5px solid #1e2530', flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder="Ask about FX, macro, scenarios..."
          style={{
            flex: 1, background: '#0a0c0f', border: '0.5px solid #2a3444', color: '#e2e8f0',
            fontSize: 10, padding: '5px 8px', borderRadius: 2, outline: 'none',
            fontFamily: 'inherit',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = '#f0b429')}
          onBlur={e => (e.currentTarget.style.borderColor = '#2a3444')}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          style={{
            background: '#f0b429', color: '#0a0c0f', border: 'none', padding: '5px 12px',
            fontSize: 9, fontWeight: 700, borderRadius: 2, cursor: 'pointer', fontFamily: 'inherit',
            opacity: loading || !input.trim() ? 0.4 : 1,
          }}
        >
          SEND
        </button>
      </div>
    </div>
  )
}
