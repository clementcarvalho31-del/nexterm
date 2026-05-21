import { NextResponse } from 'next/server'

export const runtime = 'edge'

interface FeedItem {
  id: string; title: string; summary: string; category: string
  author: string; time: string; ago: string; url: string
  type: 'news'|'analysis'|'alert'; important: boolean
}

const strip = (s: string) => s.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ').replace(/&#\d+;/g,'').trim()

async function scrapeInvestingLive(): Promise<FeedItem[]> {
  const res = await fetch('https://investinglive.com/live-feed/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,*/*;q=0.9',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()
  const items: FeedItem[] = []

  // Parse <article> blocks
  const articleRe  = /<article[^>]*>([\s\S]*?)<\/article>/gi
  const titleRe    = /<h[23][^>]*>([\s\S]*?)<\/h[23]>/i
  const paraRe     = /<p[^>]*>([\s\S]*?)<\/p>/i
  const timeRe     = /<time[^>]*datetime="([^"]*)"[^>]*>([^<]*)<\/time>/i
  const catRe      = /<[^>]*class="[^"]*(?:category|tag|label)[^"]*"[^>]*>([\s\S]*?)<\/[a-z]+>/i
  const authorRe   = /<[^>]*class="[^"]*author[^"]*"[^>]*>([\s\S]*?)<\/[a-z]+>/i
  const linkRe     = /href="(https?:\/\/investinglive\.com\/[^"]+)"/i

  let m; let i = 0
  while ((m = articleRe.exec(html)) !== null && i < 18) {
    const b = m[1]
    const tm = titleRe.exec(b); if (!tm) continue
    const title = strip(tm[1]); if (!title || title.length < 8) continue
    const pm  = paraRe.exec(b)
    const dtm = timeRe.exec(b)
    const cm  = catRe.exec(b)
    const am  = authorRe.exec(b)
    const lm  = linkRe.exec(b)
    const pubDate = dtm ? new Date(dtm[1]) : new Date()
    const diff    = Math.floor((Date.now() - pubDate.getTime()) / 60000)
    const ago     = diff < 1 ? 'Just now' : diff < 60 ? `${diff}m ago` : `${Math.floor(diff/60)}h ${diff%60}m ago`
    const cat     = cm ? strip(cm[1]) : 'News'
    const important = /NFP|CPI|FOMC|Fed|ECB|BOJ|rate|inflation|GDP|payroll|central bank/i.test(title)
    const type: FeedItem['type'] = /analysis|outlook|forecast|review/i.test(cat) ? 'analysis' : /alert|breaking|urgent/i.test(cat) ? 'alert' : 'news'
    items.push({ id:`il-${i}`, title, summary: pm ? strip(pm[1]) : '', category: cat, author: am ? strip(am[1]) : 'InvestingLive', time: pubDate.toISOString(), ago, url: lm ? lm[1] : 'https://investinglive.com/live-feed/', type, important })
    i++
  }

  // JSON-LD fallback
  if (items.length === 0) {
    const jRe = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
    let jm
    while ((jm = jRe.exec(html)) !== null) {
      try {
        const data = JSON.parse(jm[1])
        const arr = Array.isArray(data) ? data : (data['@graph'] ?? [data])
        for (const item of arr) {
          if (!['NewsArticle','Article'].includes(item['@type'])) continue
          const title = item.headline || item.name || ''; if (!title) continue
          const pub = item.datePublished ? new Date(item.datePublished) : new Date()
          const diff = Math.floor((Date.now() - pub.getTime()) / 60000)
          items.push({ id:`jl-${items.length}`, title, summary: item.description || '', category: item.articleSection || 'News', author: item.author?.name || 'InvestingLive', time: pub.toISOString(), ago: diff < 60 ? `${diff}m ago` : `${Math.floor(diff/60)}h ago`, url: item.url || 'https://investinglive.com/live-feed/', type:'news', important: false })
          if (items.length >= 15) break
        }
      } catch {}
    }
  }
  return items
}

async function fetchFinancialJuice(): Promise<FeedItem[]> {
  const res = await fetch('https://www.financialjuice.com/feed.ashx?t=news', {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/rss+xml,text/xml,*/*' },
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error('FJ failed')
  const xml  = await res.text()
  const items: FeedItem[] = []
  const iRe  = /<item>([\s\S]*?)<\/item>/gi
  const tRe  = /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i
  const dRe  = /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i
  const pRe  = /<pubDate>([\s\S]*?)<\/pubDate>/i
  const lRe  = /<link>([\s\S]*?)<\/link>/i
  let m; let i = 0
  while ((m = iRe.exec(xml)) !== null && i < 12) {
    const b = m[1]
    const tm = tRe.exec(b); if (!tm) continue
    const title = strip(tm[1]); if (!title) continue
    const pm = pRe.exec(b)
    const pub = pm ? new Date(pm[1]) : new Date()
    const diff = Math.floor((Date.now() - pub.getTime()) / 60000)
    const lm = lRe.exec(b)
    items.push({ id:`fj-${i}`, title, summary: dRe.exec(b) ? strip(dRe.exec(b)![1]) : '', category:'Market News', author:'FinancialJuice', time: pub.toISOString(), ago: diff < 60 ? `${diff}m ago` : `${Math.floor(diff/60)}h ago`, url: lm ? lm[1].trim() : '#', type:'news', important:/NFP|CPI|FOMC|Fed|ECB|BOJ|rate|inflation/i.test(title) })
    i++
  }
  return items
}

const FALLBACK: FeedItem[] = [
  { id:'f1', title:'Fed Williams: Inflation remains sticky — data-dependent approach confirmed', summary:'Federal Reserve official signals no rush to cut rates ahead of June meeting.', category:'Central Banks', author:'Reuters', time:new Date().toISOString(), ago:'8m ago', url:'https://investinglive.com/live-feed/', type:'news', important:true },
  { id:'f2', title:'Just 4% of fund managers see a hard landing — BofA survey', summary:'Bank of America Fund Manager Survey shows overwhelming soft landing consensus.', category:'News', author:'Bloomberg', time:new Date(Date.now()-27*6e4).toISOString(), ago:'27m ago', url:'https://investinglive.com/live-feed/', type:'news', important:false },
  { id:'f3', title:'What are the main events for today?', summary:'The highlights include the Canadian CPI report and Fed\'s Waller speech.', category:'Session Wrap', author:'InvestingLive', time:new Date(Date.now()-42*6e4).toISOString(), ago:'42m ago', url:'https://investinglive.com/live-feed/', type:'analysis', important:false },
  { id:'f4', title:'ECB sources: June cut of 25bp effectively decided, July uncertain', summary:'European Central Bank officials signal first rate cut is locked in for June.', category:'Central Banks', author:'Reuters', time:new Date(Date.now()-65*6e4).toISOString(), ago:'1h 5m ago', url:'https://investinglive.com/live-feed/', type:'alert', important:true },
  { id:'f5', title:'Gold breaks $2,320 — geopolitical bid + falling real yields', summary:'XAU/USD extends rally as Middle East tensions increase haven demand.', category:'Commodities', author:'Bloomberg', time:new Date(Date.now()-90*6e4).toISOString(), ago:'1h 30m ago', url:'https://investinglive.com/live-feed/', type:'news', important:false },
  { id:'f6', title:'NFP Preview: Consensus 175K — USD vulnerable on miss', summary:'Economists expect non-farm payrolls to slow from 303K prior.', category:'Forex', author:'InvestingLive', time:new Date(Date.now()-120*6e4).toISOString(), ago:'2h ago', url:'https://investinglive.com/live-feed/', type:'analysis', important:true },
  { id:'f7', title:'Brent crude futures dip on Iran de-escalation — IEA warns of tight supply', summary:'Oil prices ease after geopolitical risk premium fades but supply concerns persist.', category:'Commodities', author:'Reuters', time:new Date(Date.now()-135*6e4).toISOString(), ago:'2h 15m ago', url:'https://investinglive.com/live-feed/', type:'news', important:false },
  { id:'f8', title:'S&P 500 up 8.5% YTD on strong earnings — valuation at 21x forward P/E', summary:'US equities continue their strong run despite elevated valuations vs historical averages.', category:'Stock market update', author:'InvestingLive', time:new Date(Date.now()-180*6e4).toISOString(), ago:'3h ago', url:'https://investinglive.com/live-feed/', type:'analysis', important:false },
]

export async function GET() {
  const [r1, r2] = await Promise.allSettled([scrapeInvestingLive(), fetchFinancialJuice()])
  const live = r1.status === 'fulfilled' ? r1.value : []
  const fj   = r2.status === 'fulfilled' ? r2.value : []
  const data = [...live, ...fj].slice(0, 20)
  return NextResponse.json({
    ok: true,
    data: data.length > 0 ? data : FALLBACK,
    source: live.length > 0 ? 'investinglive' : fj.length > 0 ? 'financialjuice' : 'fallback',
    ts: Date.now(),
  }, { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } })
}
