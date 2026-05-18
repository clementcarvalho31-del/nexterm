import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/src/features/ai/services/AIService'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { messages, systemContext } = await req.json()
    const content = await callClaude(messages, systemContext)
    return NextResponse.json({ content })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error'
    console.error('[/api/ai/chat]', msg)
    return NextResponse.json({ content: 'AI service unavailable.' }, { status: 200 })
  }
}
