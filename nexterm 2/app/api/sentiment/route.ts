import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Myfxbook public community outlook
    const res = await fetch('https://www.myfxbook.com/api/get-community-outlook.json', {
      next: { revalidate: 60 },
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    if (!res.ok) throw new Error('Myfxbook failed')
    const json = await res.json()
    if (json.error || !json.symbols) throw new Error('No data')

    const data = json.symbols.map((s: any) => ({
      pair: s.name.replace('_','/')
                  .replace('EURUSD','EUR/USD').replace('GBPUSD','GBP/USD')
                  .replace('USDJPY','USD/JPY').replace('USDCAD','USD/CAD')
                  .replace('AUDUSD','AUD/USD').replace('NZDUSD','NZD/USD')
                  .replace('USDCHF','USD/CHF').replace('XAUUSD','XAU/USD'),
      longPct:  Math.round(s.longPercentage),
      shortPct: Math.round(s.shortPercentage),
      longVol:  Math.round(s.longVolume || 0),
      shortVol: Math.round(s.shortVolume || 0),
      bias: s.longPercentage > 55 ? 'bullish' : s.longPercentage < 45 ? 'bearish' : 'neutral',
      change24h: parseFloat((s.longPercentage - (s.longPercentagePrev || s.longPercentage)).toFixed(1))
    }))
    return NextResponse.json({ ok: true, data })
  } catch {
    return NextResponse.json({ ok: false, data: [] })
  }
}
