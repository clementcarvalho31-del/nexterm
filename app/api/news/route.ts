import { NextResponse } from 'next/server'

// ─── Source 1: FinancialJuice RSS (real-time squawk feed) ─────────────────────
async function fetchFinancialJuice() {
  const res = await fetch('https://www.financialjuice.com/feed.ashx?xy=all', {
    next: { revalidate: 30 },
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Nexterm/1.0)' },
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error(`FJ HTTP ${res.status}`)
  const text = await res.text()
  const items: { title: string; date: string; link: string; tags: string[] }[] = []
  const matches = text.matchAll(/<item>([\s\S]*?)<\/item>/g)
  for (const m of matches) {
    const b     = m[1]
    const title = b.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
                ?? b.match(/<title>(.*?)<\/title>/)?.[1]
                ?? ''
    const date  = b.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? new Date().toISOString()
    const link  = b.match(/<link>(.*?)<\/link>/)?.[1] ?? ''
    const tags: string[] = []
    for (const c of b.matchAll(/<category><!\[CDATA\[(.*?)\]\]><\/category>/g)) tags.push(c[1])
    if (title.trim()) items.push({ title: title.trim(), date, link, tags })
  }
  if (items.length === 0) throw new Error('FJ empty')
  return items.slice(0, 60)
}

// ─── Source 2: ForexLive RSS (backup) ────────────────────────────────────────
async function fetchForexLive() {
  const res = await fetch('https://www.forexlive.com/feed/news', {
    next: { revalidate: 30 },
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error(`FL HTTP ${res.status}`)
  const text = await res.text()
  const items: { title: string; date: string; link: string; tags: string[] }[] = []
  const matches = text.matchAll(/<item>([\s\S]*?)<\/item>/g)
  for (const m of matches) {
    const b     = m[1]
    const title = b.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
                ?? b.match(/<title>(.*?)<\/title>/)?.[1]
                ?? ''
    const date  = b.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? new Date().toISOString()
    const link  = b.match(/<link>(.*?)<\/link>/)?.[1]
                ?? b.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1]
                ?? ''
    const tags: string[] = []
    for (const c of b.matchAll(/<category><!\[CDATA\[(.*?)\]\]><\/category>/g)) tags.push(c[1])
    if (title.trim()) items.push({ title: title.trim(), date, link, tags })
  }
  if (items.length === 0) throw new Error('FL empty')
  return items.slice(0, 60)
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function GET() {
  // Try FinancialJuice first, fall back to ForexLive
  try {
    const data = await fetchFinancialJuice()
    return NextResponse.json({ ok: true, source: 'financialjuice', data })
  } catch (e1) {
    try {
      const data = await fetchForexLive()
      return NextResponse.json({ ok: true, source: 'forexlive', data })
    } catch (e2) {
      console.error('News API: all sources failed', e1, e2)
      return NextResponse.json({ ok: false, source: null, data: [] })
    }
  }
}
