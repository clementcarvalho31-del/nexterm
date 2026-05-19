'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

interface FeedItem {
  id: string; title: string; summary: string; category: string
  author: string; time: string; ago: string; url: string
  type: 'news'|'analysis'|'alert'; important: boolean
}

const CAT_COLORS: Record<string, string> = {
  'Central Banks':       '#f0b429',
  'Forex':               '#3b82f6',
  'Commodities':         '#f97316',
  'Stock market update': '#22c55e',
  'Cryptocurrency':      '#a78bfa',
  'Session Wrap':        '#06b6d4',
  'Forex Orders':        '#ec4899',
  'Technical Analysis':  '#8b5cf6',
  'News':                '#6b7280',
  'Market News':         '#6b7280',
  'Education':           '#10b981',
  'analysis':            '#38bdf8',
  'alert':               '#ef4444',
}

const ALL_CATS = ['All','Central Banks','Forex','Commodities','Stock market update','Cryptocurrency','Session Wrap','Technical Analysis']

function getCatColor(cat: string) {
  return CAT_COLORS[cat] || '#6b7280'
}

function TimeAgo({ ago, time }: { ago: string; time: string }) {
  const [display, setDisplay] = useState(ago)
  useEffect(() => {
    const update = () => {
      try {
        const diff = Math.floor((Date.now() - new Date(time).getTime()) / 60000)
        if (diff < 1) setDisplay('Just now')
        else if (diff < 60) setDisplay(`${diff}m ago`)
        else setDisplay(`${Math.floor(diff/60)}h ${diff%60}m ago`)
      } catch { setDisplay(ago) }
    }
    update()
    const id = setInterval(update, 30000)
    return () => clearInterval(id)
  }, [time, ago])
  return <span>{display}</span>
}

function ArticleCard({ item, compact }: { item: FeedItem; compact?: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const cc = getCatColor(item.category)
  const isImportant = item.important
  const isAlert = item.type === 'alert'

  return (
    <div style={{
      padding: compact ? '10px 16px' : '16px 20px',
      borderBottom: '0.5px solid rgba(255,255,255,.055)',
      borderLeft: `3px solid ${isAlert ? '#ef4444' : isImportant ? cc + '80' : 'transparent'}`,
      background: isAlert ? 'rgba(239,68,68,.04)' : isImportant ? `${cc}06` : 'transparent',
      cursor: 'pointer', transition: 'background 100ms',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.03)'}
      onMouseLeave={e => e.currentTarget.style.background = isAlert ? 'rgba(239,68,68,.04)' : isImportant ? `${cc}06` : 'transparent'}
    >
      {/* Meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7, flexWrap: 'wrap' as const }}>
        {isAlert && (
          <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 7px', borderRadius: 3, background: 'rgba(239,68,68,.15)', color: '#ef4444', border: '0.5px solid rgba(239,68,68,.3)', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 't-pulse 1.5s ease-in-out infinite' }}/>
            BREAKING
          </span>
        )}
        <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 7px', borderRadius: 3, letterSpacing: '0.6px', background: `${cc}14`, color: cc, border: `0.5px solid ${cc}30` }}>
          {item.category}
        </span>
        <span style={{ fontSize: 8, color: 'var(--t-text-disabled)', fontFamily: 'var(--t-font-mono)', marginLeft: 'auto' }}>
          <TimeAgo ago={item.ago} time={item.time}/>
        </span>
      </div>

      {/* Title */}
      <div style={{ fontSize: compact ? 11 : 13, fontWeight: 600, color: isImportant ? 'var(--t-text-heading)' : 'var(--t-text-secondary)', lineHeight: 1.5, marginBottom: item.summary ? 8 : 0, letterSpacing: '-0.1px' }}>
        {item.title}
      </div>

      {/* Summary */}
      {!compact && item.summary && (
        <p style={{ fontSize: 11, color: 'var(--t-text-muted)', lineHeight: 1.65, marginBottom: 8 }}>
          {item.summary}
        </p>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontSize: 8, color: 'var(--t-text-disabled)', fontFamily: 'var(--t-font-mono)' }}>{item.author}</span>
        <a href={item.url} target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{ fontSize: 8, color: cc, textDecoration: 'none', opacity: 0.7, transition: 'opacity 120ms' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
        >Read →</a>
      </div>
    </div>
  )
}

export function LiveFeedPanel() {
  const [items, setItems]           = useState<FeedItem[]>([])
  const [loading, setLoading]       = useState(true)
  const [source, setSource]         = useState('')
  const [lastUpdate, setLastUpdate] = useState('')
  const [activeCat, setActiveCat]   = useState('All')
  const [refreshing, setRefreshing] = useState(false)
  const [newIds, setNewIds]         = useState<Set<string>>(new Set())
  const prevIds                     = useRef<Set<string>>(new Set())
  const [countdown, setCountdown]   = useState(30)

  const fetchFeed = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true)
    try {
      const res  = await fetch('/api/livefeed', { cache: 'no-store' })
      const json = await res.json()
      if (json.ok && json.data) {
        const incoming = json.data as FeedItem[]
        const freshIds = new Set<string>()
        incoming.forEach(item => {
          if (!prevIds.current.has(item.id)) freshIds.add(item.id)
        })
        setNewIds(freshIds)
        setTimeout(() => setNewIds(new Set()), 4000)
        prevIds.current = new Set(incoming.map(i => i.id))
        setItems(incoming)
        setSource(json.source)
        setLastUpdate(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      }
    } catch {}
    finally { setLoading(false); setRefreshing(false); setCountdown(30) }
  }, [])

  useEffect(() => { fetchFeed(); const id = setInterval(() => fetchFeed(true), 30000); return () => clearInterval(id) }, [fetchFeed])

  // Countdown timer
  useEffect(() => {
    const id = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 30), 1000)
    return () => clearInterval(id)
  }, [])

  const filtered = activeCat === 'All' ? items : items.filter(i => i.category === activeCat)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--t-surface-base)', fontFamily: 'var(--t-font-sans)' }}>

      {/* ── Header ── */}
      <div style={{
        padding: '16px 20px 14px', flexShrink: 0,
        background: 'linear-gradient(180deg, rgba(13,18,28,.98) 0%, rgba(6,9,18,.98) 100%)',
        borderBottom: '1px solid rgba(255,255,255,.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', color: 'var(--t-text-muted)', textTransform: 'uppercase' as const, marginBottom: 4, fontFamily: 'var(--t-font-mono)' }}>
              Institutional News Desk
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--t-text-heading)', letterSpacing: '-0.5px', margin: 0 }}>
                Live Feed
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 4, background: 'rgba(239,68,68,.08)', border: '0.5px solid rgba(239,68,68,.2)' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 't-pulse 2s ease-in-out infinite', boxShadow: '0 0 6px rgba(239,68,68,.6)' }}/>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#ef4444', fontFamily: 'var(--t-font-mono)', letterSpacing: '0.5px' }}>LIVE</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Countdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 5, background: 'rgba(255,255,255,.03)', border: '0.5px solid rgba(255,255,255,.07)' }}>
              <div style={{ width: 28, height: 3, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(countdown/30)*100}%`, background: 'var(--t-accent-primary)', borderRadius: 2, transition: 'width 1s linear' }}/>
              </div>
              <span style={{ fontSize: 8, color: 'var(--t-text-disabled)', fontFamily: 'var(--t-font-mono)' }}>{countdown}s</span>
            </div>

            {lastUpdate && <span style={{ fontSize: 8, color: 'var(--t-text-disabled)', fontFamily: 'var(--t-font-mono)' }}>Updated {lastUpdate}</span>}

            <button onClick={() => fetchFeed()} style={{
              padding: '5px 10px', borderRadius: 5, fontSize: 9, fontWeight: 600, cursor: 'pointer',
              border: '0.5px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.04)',
              color: 'var(--t-text-muted)', fontFamily: 'var(--t-font-sans)', letterSpacing: '0.3px',
              transition: 'all 150ms', display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span style={{ display: 'inline-block', animation: refreshing ? 't-spin 0.8s linear infinite' : 'none' }}>↻</span>
              Refresh
            </button>
          </div>
        </div>

        {/* Category filters */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const }}>
          {ALL_CATS.map(cat => {
            const isActive = activeCat === cat
            const cc = getCatColor(cat)
            return (
              <button key={cat} onClick={() => setActiveCat(cat)} style={{
                padding: '4px 11px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--t-font-sans)', transition: 'all 130ms',
                border: `0.5px solid ${isActive ? cc + '55' : 'rgba(255,255,255,.08)'}`,
                background: isActive ? `${cc}12` : 'transparent',
                color: isActive ? cc : 'var(--t-text-muted)',
              }}>
                {cat}
              </button>
            )
          })}
          {lastUpdate && (
            <span style={{ marginLeft: 'auto', fontSize: 8, color: 'var(--t-text-disabled)', fontFamily: 'var(--t-font-mono)', alignSelf: 'center' }}>
              {source === 'investinglive' ? '⚡ investinglive.com' : source === 'financialjuice' ? '📡 financialjuice.com' : '📰 curated'}
            </span>
          )}
        </div>
      </div>

      {/* ── Feed ── */}
      <div style={{ flex: 1, overflowY: 'auto' as const }}>
        {loading ? (
          // Skeleton
          <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                <div style={{ height: 10, width: '40%', background: 'rgba(255,255,255,.06)', borderRadius: 3, animation: 't-shimmer 1.5s linear infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,.04) 25%, rgba(255,255,255,.09) 50%, rgba(255,255,255,.04) 75%)' }}/>
                <div style={{ height: 14, width: '90%', background: 'rgba(255,255,255,.06)', borderRadius: 3, animation: 't-shimmer 1.5s linear infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,.04) 25%, rgba(255,255,255,.09) 50%, rgba(255,255,255,.04) 75%)' }}/>
                <div style={{ height: 10, width: '65%', background: 'rgba(255,255,255,.06)', borderRadius: 3, animation: 't-shimmer 1.5s linear infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,.04) 25%, rgba(255,255,255,.09) 50%, rgba(255,255,255,.04) 75%)' }}/>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' as const, color: 'var(--t-text-muted)', fontSize: 12 }}>
            Aucun article pour cette catégorie
          </div>
        ) : (
          filtered.map((item, i) => (
            <div key={item.id} style={{ animation: newIds.has(item.id) ? 't-fade-in 0.3s ease-out both' : i < 3 ? `t-fade-in ${0.05 * i}s ease-out both` : 'none' }}>
              <ArticleCard item={item}/>
            </div>
          ))
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{ padding: '5px 20px', borderTop: '0.5px solid rgba(255,255,255,.05)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 7, color: 'var(--t-text-disabled)', fontFamily: 'var(--t-font-mono)', letterSpacing: '0.5px' }}>
          INVESTINGLIVE.COM · FINANCIALJUICE · REFRESH 30S
        </span>
        <span style={{ fontSize: 7, color: 'var(--t-text-disabled)', fontFamily: 'var(--t-font-mono)' }}>
          {filtered.length} articles
        </span>
      </div>
    </div>
  )
}
