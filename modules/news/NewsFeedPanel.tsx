'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useTerminalStore } from '@/store/terminal'

// ─── Types ────────────────────────────────────────────────────────────────────
interface RawItem {
  title: string
  date:  string
  link:  string
  tags:  string[]
}

interface NewsItem {
  id:       string
  title:    string
  date:     Date
  link:     string
  tags:     string[]
  impact:   'high' | 'med' | 'low'
  tag:      string
}

// ─── Constants ────────────────────────────────────────────────────────────────
const IMPACT_CFG = {
  high: { dot: '#ef4444', bg: 'rgba(239,68,68,.06)',   label: 'HIGH' },
  med:  { dot: '#f0b429', bg: 'rgba(240,180,41,.04)',  label: 'MED'  },
  low:  { dot: '#3b82f6', bg: 'transparent',            label: 'LOW'  },
} as const

const HIGH_KW = ['fed','fomc','powell','ecb','bce','lagarde','boj','cpi','pce','nfp','gdp','inflation','rate decision','hike','cut','emergency','intervention','recession','crash','default','crisis','war','sanction']
const MED_KW  = ['pmi','ism','retail','housing','unemployment','jobless','trade','deficit','surplus','treasury','yield','dollar','euro','yen','pound','oil','gold','bitcoin','earnings','oecd','imf']

const FILTERS = [
  { key: 'all',    label: 'Tous',        kw: [] as string[] },
  { key: 'forex',  label: 'Forex',       kw: ['eur','usd','gbp','jpy','chf','aud','nzd','cad','fx','dollar','euro','yen','pound','franc','forex'] },
  { key: 'macro',  label: 'Macro',       kw: ['fed','bce','ecb','boj','cpi','gdp','pmi','nfp','inflation','rate','fomc','powell','lagarde','employment','jobs','central bank'] },
  { key: 'stocks', label: 'Actions',     kw: ['stock','equity','s&p','nasdaq','dow','cac','dax','ftse','earnings','ipo','shares','dividend','index','wall street'] },
  { key: 'commo',  label: 'Matières',    kw: ['oil','gold','silver','copper','wti','brent','crude','wheat','corn','commodity','natural gas','opec'] },
  { key: 'crypto', label: 'Crypto',      kw: ['bitcoin','btc','ethereum','eth','crypto','blockchain','defi','binance','coinbase','altcoin'] },
  { key: 'bonds',  label: 'Obligations', kw: ['bond','treasury','yield','debt','sovereign','bund','gilt','note','spread'] },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function classifyImpact(title: string): 'high' | 'med' | 'low' {
  const t = title.toLowerCase()
  if (HIGH_KW.some(k => t.includes(k))) return 'high'
  if (MED_KW.some(k => t.includes(k)))  return 'med'
  return 'low'
}

function extractTag(title: string, tags: string[]): string {
  const t = title.toLowerCase()
  if (t.includes('fed') || t.includes('fomc') || t.includes('powell')) return 'FED'
  if (t.includes('ecb') || t.includes('bce') || t.includes('lagarde')) return 'ECB'
  if (t.includes('boj') || t.includes('japan') || t.includes('ueda'))  return 'BOJ'
  if (t.includes('boe') || t.includes('bank of england'))              return 'BOE'
  if (t.includes('snb'))                                                return 'SNB'
  if (t.includes('rba'))                                                return 'RBA'
  if (t.includes('nfp') || t.includes('non-farm'))                     return 'NFP'
  if (t.includes('cpi') || t.includes('inflation'))                    return 'CPI'
  if (t.includes('gdp'))                                                return 'GDP'
  if (t.includes('pmi'))                                                return 'PMI'
  if (t.includes('gold') || t.includes('xau'))                         return 'GOLD'
  if (t.includes('wti') || t.includes('crude') || t.includes('brent')) return 'OIL'
  if (t.includes('bitcoin') || t.includes('btc'))                      return 'BTC'
  if (t.includes('eur/usd') || t.includes('eurusd'))                   return 'EUR/USD'
  if (t.includes('gbp/usd') || t.includes('gbpusd'))                   return 'GBP/USD'
  if (t.includes('usd/jpy') || t.includes('usdjpy'))                   return 'USD/JPY'
  if (t.includes('dxy') || t.includes('dollar index'))                 return 'DXY'
  if (t.includes('euro') || t.includes(' eur'))                        return 'EUR'
  if (t.includes('yen')  || t.includes(' jpy'))                        return 'JPY'
  if (t.includes('pound') || t.includes(' gbp'))                       return 'GBP'
  if (tags.length > 0) return tags[0].toUpperCase().slice(0, 8)
  return 'MACRO'
}

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60)    return `${diff}s`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

function transform(raw: RawItem[]): NewsItem[] {
  return raw.map((r, i) => ({
    id:     `${i}-${r.date}`,
    title:  r.title,
    date:   new Date(r.date),
    link:   r.link,
    tags:   r.tags,
    impact: classifyImpact(r.title),
    tag:    extractTag(r.title, r.tags),
  }))
}

// ─── Component ────────────────────────────────────────────────────────────────
export function NewsFeedPanel() {
  const squawkEnabled = useTerminalStore(s => s.squawkEnabled)
  const toggleSquawk  = useTerminalStore(s => s.toggleSquawk)

  const [items,      setItems]      = useState<NewsItem[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(false)
  const [filter,     setFilter]     = useState('all')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [spinning,   setSpinning]   = useState(false)
  const [newIds,     setNewIds]     = useState<Set<string>>(new Set())
  const prevIds  = useRef<Set<string>>(new Set())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async (soft = false) => {
    if (soft) setSpinning(true)
    else setLoading(true)
    setError(false)
    try {
      const res  = await fetch('/api/news', { cache: 'no-store' })
      const json = await res.json()
      if (!json.ok || !json.data?.length) throw new Error('empty')
      const next   = transform(json.data as RawItem[])
      const ids    = new Set(next.map(i => i.id))
      const fresh  = new Set([...ids].filter(id => !prevIds.current.has(id)))
      prevIds.current = ids
      setNewIds(fresh)
      setItems(next)
      setLastUpdate(new Date())
      if (fresh.size > 0) setTimeout(() => setNewIds(new Set()), 3500)
    } catch {
      if (!soft) setError(true)
    } finally {
      setLoading(false)
      setSpinning(false)
    }
  }, [])

  useEffect(() => {
    load(false)
    timerRef.current = setInterval(() => load(true), 30_000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [load])

  const filtered    = items.filter(i => {
    if (filter === 'all') return true
    const f = FILTERS.find(f => f.key === filter)
    if (!f) return true
    const t = i.title.toLowerCase()
    return f.kw.some(k => t.includes(k))
  })
  const highCount   = filtered.filter(i => i.impact === 'high').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--t-surface-base)' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 10px', height: 32, flexShrink: 0,
        background: 'var(--t-surface-elevated)',
        borderBottom: '0.5px solid var(--t-border-default)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '1.3px', color: 'var(--t-text-muted)', fontFamily: 'var(--t-font-mono)', textTransform: 'uppercase' }}>News Feed</span>
          <span style={{
            width: 4, height: 4, borderRadius: '50%', display: 'inline-block',
            background: error ? '#f0b429' : '#ef4444',
            animation: 't-pulse 2s ease-in-out infinite',
            boxShadow: `0 0 5px ${error ? 'rgba(240,180,41,.6)' : 'rgba(239,68,68,.6)'}`,
          }}/>
          {highCount > 0 && (
            <span style={{
              fontSize: 7, fontWeight: 700, padding: '1px 4px', borderRadius: 2,
              background: 'rgba(239,68,68,.1)', color: '#ef4444',
              border: '0.5px solid rgba(239,68,68,.22)', fontFamily: 'var(--t-font-mono)',
            }}>{highCount} HIGH</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {lastUpdate && (
            <span style={{ fontSize: 7, color: 'var(--t-text-disabled)', fontFamily: 'var(--t-font-mono)' }}>
              {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => load(true)}
            disabled={spinning}
            style={{
              background: 'none', border: 'none', cursor: spinning ? 'default' : 'pointer',
              padding: '2px 4px', borderRadius: 3, color: 'var(--t-text-disabled)',
              fontSize: 11, lineHeight: 1, display: 'flex', alignItems: 'center',
            }}
            onMouseEnter={e => { if (!spinning) (e.currentTarget as HTMLButtonElement).style.color = 'var(--t-accent-primary)' }}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--t-text-disabled)'}
          >
            <span style={{ display: 'inline-block', animation: spinning ? 't-spin 0.7s linear infinite' : 'none' }}>↻</span>
          </button>
          <span style={{ fontSize: 7, color: 'var(--t-text-disabled)', fontFamily: 'var(--t-font-mono)' }}>{filtered.length}</span>
        </div>
      </div>

      {/* ── Squawk toggle ── */}
      <button onClick={toggleSquawk} style={{
        display: 'flex', alignItems: 'center', gap: 7, padding: '5px 10px',
        borderBottom: '0.5px solid var(--t-border-default)', flexShrink: 0,
        background: squawkEnabled ? 'rgba(240,180,41,.04)' : 'transparent',
        border: 'none', width: '100%', cursor: 'pointer', transition: 'background 150ms',
        textAlign: 'left',
      }}>
        <span style={{ fontSize: 11 }}>{squawkEnabled ? '🔊' : '🔇'}</span>
        <div>
          <div style={{ fontSize: 8, fontWeight: 600, fontFamily: 'var(--t-font-mono)', letterSpacing: '0.5px', color: squawkEnabled ? 'var(--t-accent-primary)' : 'var(--t-text-disabled)' }}>
            {squawkEnabled ? 'SQUAWK LIVE' : 'SQUAWK OFF'}
          </div>
          <div style={{ fontSize: 7, color: 'var(--t-text-disabled)', fontFamily: 'var(--t-font-mono)' }}>
            {squawkEnabled ? 'Audio alerts active' : 'Click to enable audio'}
          </div>
        </div>
      </button>

      {/* ── Filter tabs ── */}
      <div style={{
        display: 'flex', alignItems: 'stretch',
        borderBottom: '0.5px solid var(--t-border-default)',
        flexShrink: 0, overflowX: 'auto', scrollbarWidth: 'none', height: 26,
      }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            background: 'none', border: 'none',
            borderBottom: filter === f.key ? '1.5px solid var(--t-accent-primary)' : '1.5px solid transparent',
            color: filter === f.key ? 'var(--t-accent-primary)' : 'var(--t-text-disabled)',
            fontSize: 7, fontWeight: filter === f.key ? 700 : 500,
            fontFamily: 'var(--t-font-mono)', letterSpacing: '0.7px',
            textTransform: 'uppercase', cursor: 'pointer',
            padding: '0 8px', whiteSpace: 'nowrap',
            transition: 'color 120ms, border-color 120ms',
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Skeleton */}
        {loading && [...Array(9)].map((_, i) => (
          <div key={i} style={{ padding: '8px 10px', borderBottom: '0.5px solid var(--t-border-subtle)' }}>
            <div style={{ display: 'flex', gap: 5, marginBottom: 5, alignItems: 'center' }}>
              <div className="t-shimmer" style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--t-surface-hover)', flexShrink: 0 }}/>
              <div className="t-shimmer" style={{ width: 30, height: 7, borderRadius: 2 }}/>
              <div className="t-shimmer" style={{ width: 20, height: 7, borderRadius: 2, marginLeft: 'auto' }}/>
            </div>
            <div className="t-shimmer" style={{ width: `${65 + (i % 4) * 8}%`, height: 8, borderRadius: 2, marginBottom: 3 }}/>
            <div className="t-shimmer" style={{ width: `${40 + (i % 3) * 10}%`, height: 8, borderRadius: 2 }}/>
          </div>
        ))}

        {/* Error */}
        {!loading && error && (
          <div style={{ padding: '24px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 8, opacity: 0.5 }}>⚠</div>
            <div style={{ fontSize: 8, color: 'var(--t-text-disabled)', fontFamily: 'var(--t-font-mono)', marginBottom: 6, letterSpacing: '0.5px' }}>FLUX INDISPONIBLE</div>
            <div style={{ fontSize: 8, color: 'var(--t-text-muted)', fontFamily: 'var(--t-font-sans)', marginBottom: 12 }}>Impossible de charger FinancialJuice RSS</div>
            <button onClick={() => load(false)} style={{
              fontSize: 8, fontFamily: 'var(--t-font-mono)', fontWeight: 600,
              letterSpacing: '0.5px', textTransform: 'uppercase',
              padding: '5px 12px', borderRadius: 3, cursor: 'pointer',
              background: 'rgba(240,180,41,.08)', border: '0.5px solid rgba(240,180,41,.25)',
              color: 'var(--t-accent-primary)',
            }}>Réessayer</button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ padding: '20px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 8, color: 'var(--t-text-disabled)', fontFamily: 'var(--t-font-mono)', letterSpacing: '0.5px' }}>
              AUCUN ARTICLE · {FILTERS.find(f => f.key === filter)?.label.toUpperCase()}
            </div>
          </div>
        )}

        {/* Articles */}
        {!loading && !error && filtered.map((item, i) => {
          const cfg    = IMPACT_CFG[item.impact]
          const isHigh = item.impact === 'high'
          const isNew  = newIds.has(item.id)
          return (
            <a
              key={item.id}
              href={item.link || '#'}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block', textDecoration: 'none',
                padding: '7px 10px', borderBottom: '0.5px solid var(--t-border-subtle)',
                background: isNew ? 'rgba(240,180,41,.06)' : cfg.bg,
                borderLeft: isHigh ? '2px solid rgba(239,68,68,.35)' : '2px solid transparent',
                cursor: 'pointer', transition: 'background 100ms',
                animation: i < 4 ? `t-fade-in ${0.08 + i * 0.04}s ease-out both` : 'none',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'var(--t-surface-hover)'}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = isNew ? 'rgba(240,180,41,.06)' : cfg.bg}
            >
              {/* Meta row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <span style={{
                  width: 4, height: 4, borderRadius: '50%', background: cfg.dot,
                  display: 'inline-block', flexShrink: 0,
                  boxShadow: isHigh ? `0 0 4px ${cfg.dot}99` : 'none',
                }}/>
                <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.5px', color: cfg.dot, fontFamily: 'var(--t-font-mono)' }}>
                  {item.tag}
                </span>
                {isNew && (
                  <span style={{
                    fontSize: 6, fontWeight: 700, padding: '1px 3px', borderRadius: 2,
                    background: 'rgba(240,180,41,.15)', color: 'var(--t-accent-primary)',
                    border: '0.5px solid rgba(240,180,41,.3)', fontFamily: 'var(--t-font-mono)',
                  }}>NEW</span>
                )}
                <span style={{ fontSize: 7, color: 'var(--t-text-disabled)', fontFamily: 'var(--t-font-mono)', marginLeft: 'auto', flexShrink: 0 }}>
                  {timeAgo(item.date)}
                </span>
              </div>

              {/* Title */}
              <p style={{
                fontSize: 9, lineHeight: 1.55, margin: 0,
                color: isHigh ? 'var(--t-text-secondary)' : 'var(--t-text-muted)',
                fontFamily: 'var(--t-font-sans)',
              }}>
                {item.title}
              </p>

              {/* Tags */}
              {item.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 3, marginTop: 4, flexWrap: 'wrap' }}>
                  {item.tags.slice(0, 3).map((tag, ti) => (
                    <span key={ti} style={{
                      fontSize: 7, padding: '1px 4px', borderRadius: 2,
                      background: 'var(--t-surface-active)',
                      color: 'var(--t-text-disabled)',
                      fontFamily: 'var(--t-font-mono)',
                      border: '0.5px solid var(--t-border-subtle)',
                    }}>{tag}</span>
                  ))}
                </div>
              )}
            </a>
          )
        })}
      </div>

      {/* ── Footer ── */}
      <div style={{
        flexShrink: 0, padding: '4px 10px',
        borderTop: '0.5px solid var(--t-border-subtle)',
        background: 'var(--t-surface-elevated)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 7, color: 'var(--t-text-disabled)', fontFamily: 'var(--t-font-mono)' }}>
          FinancialJuice · refresh 30s
        </span>
        <span style={{ fontSize: 7, color: 'var(--t-text-disabled)', fontFamily: 'var(--t-font-mono)' }}>
          {items.length} articles
        </span>
      </div>
    </div>
  )
}
