import { NextResponse } from 'next/server'

// Financial Juice public RSS → JSON
// Fallback to static macro news if unavailable
export async function GET() {
  try {
    // Financial Juice via RSS
    const res = await fetch('https://www.financialjuice.com/feed.ashx?xy=all', {
      next: { revalidate: 30 },
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    if (!res.ok) throw new Error('FJ failed')
    const text = await res.text()
    // Parse RSS XML
    const items: {title:string;date:string;link:string;tags:string[]}[] = []
    const itemMatches = text.matchAll(/<item>([\s\S]*?)<\/item>/g)
    for (const match of itemMatches) {
      const block = match[1]
      const title = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || block.match(/<title>(.*?)<\/title>/)?.[1] || ''
      const date  = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || new Date().toISOString()
      const link  = block.match(/<link>(.*?)<\/link>/)?.[1] || ''
      const cats: string[] = []
      const catMatches = block.matchAll(/<category><!\[CDATA\[(.*?)\]\]><\/category>/g)
      for (const c of catMatches) cats.push(c[1])
      if (title) items.push({ title, date, link, tags: cats })
    }
    if (items.length > 0) return NextResponse.json({ ok: true, data: items.slice(0, 60) })
    throw new Error('Empty')
  } catch {
    return NextResponse.json({ ok: false, data: [] })
  }
}
