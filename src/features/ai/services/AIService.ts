import type { ChatMessage } from '@/src/types'

const CLAUDE_MODEL  = 'claude-sonnet-4-20250514'
const MAX_TOKENS    = 800
const MAX_TURNS     = 10    // Last N turns sent to API

interface ChatRequest {
  messages:      ChatMessage[]
  systemContext: string
}

interface ChatResponse {
  content: string
  error?:  string
}

// ─── AI service ───────────────────────────────────────────────────────────────
class AIService {
  async chat(req: ChatRequest): Promise<ChatResponse> {
    try {
      const res = await fetch('/api/ai/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          messages:      req.messages.slice(-MAX_TURNS).map(m => ({ role: m.role, content: m.content })),
          systemContext: req.systemContext,
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      return { content: data.content ?? 'No response' }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[AIService] chat error:', message)
      return { content: '', error: message }
    }
  }
}

export const aiService = new AIService()

// ─── Route handler (server-side) ─────────────────────────────────────────────
export async function callClaude(
  messages: Array<{ role: string; content: string }>,
  systemContext: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return 'AI Copilot not configured. Add ANTHROPIC_API_KEY to .env.local'

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'Content-Type':    'application/json',
      'x-api-key':       apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      system:     systemContext,
      messages:   messages.slice(-MAX_TURNS),
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[Claude API]', err)
    throw new Error(`Claude API ${res.status}`)
  }

  const data = await res.json()
  return data.content?.[0]?.text ?? 'No response'
}
