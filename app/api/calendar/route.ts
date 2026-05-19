import { NextResponse } from 'next/server'

// Forex Factory JSON feed (public, no auth needed)
export async function GET() {
  try {
    const res = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', {
      next: { revalidate: 300 }, // refresh every 5 min
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    if (!res.ok) throw new Error('FF fetch failed')
    const data = await res.json()
    return NextResponse.json({ ok: true, data })
  } catch (e) {
    return NextResponse.json({ ok: false, data: [] })
  }
}
