'use client'
import { useState } from 'react'
import { TerminalLayout } from '@/layouts/TerminalLayout'
import { useTerminalStore } from '@/store/terminal'
import type { TabId } from '@/src/types'

const MODULES = [
  {
    id: 'calendar' as TabId,
    icon: '📅',
    title: 'Economic Calendar',
    subtitle: 'Live macro events',
    desc: 'CPI · NFP · FOMC · ECB · GDP · PMI',
    detail: 'Forecast range, scénarios bull/bear, countdown live, ★★★ impact',
    color: '#ef4444',
    glow: 'rgba(239,68,68,.2)',
    border: 'rgba(239,68,68,.25)',
    bg: 'rgba(239,68,68,.05)',
    stats: [
      { label: 'This week', value: '12 events' },
      { label: 'HIGH impact', value: '6' },
      { label: 'Next', value: 'NFP Fri' },
    ],
  },
  {
    id: 'dashboard' as TabId,
    icon: '📈',
    title: 'Market Overview',
    subtitle: 'Rates & Indices live',
    desc: 'EUR/USD · GBP/USD · USD/JPY · DXY · Gold · Oil',
    detail: 'Charts temps réel, watchlist, multi-timeframe, indicateurs',
    color: '#f0b429',
    glow: 'rgba(240,180,41,.2)',
    border: 'rgba(240,180,41,.25)',
    bg: 'rgba(240,180,41,.05)',
    stats: [
      { label: 'EUR/USD', value: '1.0843' },
      { label: 'DXY', value: '104.32' },
      { label: 'Gold', value: '$2318' },
    ],
  },
  {
    id: 'cot' as TabId,
    icon: '🌐',
    title: 'Sentiment & Flows',
    subtitle: 'Institutional positioning',
    desc: 'COT · Hedge Funds · Retail Sentiment · DXM · Bank Research',
    detail: 'Positionnement net, flux institutionnels, biais directionnels',
    color: '#22c55e',
    glow: 'rgba(34,197,94,.2)',
    border: 'rgba(34,197,94,.25)',
    bg: 'rgba(34,197,94,.05)',
    stats: [
      { label: 'EUR net', value: '+24K' },
      { label: 'JPY net', value: '-62K' },
      { label: 'Retail EUR', value: '66% long' },
    ],
  },
]

function DashboardHome({ onEnter }: { onEnter: (tab: TabId) => void }) {
  const [hovered, setHovered] = useState<TabId | null>(null)

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080b10',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', -apple-system, sans-serif",
      padding: '40px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background ambient */}
      <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%', background:'rgba(240,180,41,.03)', filter:'blur(120px)', top:'30%', left:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', background:'rgba(239,68,68,.02)', filter:'blur(100px)', bottom:'10%', right:'10%', pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:'rgba(34,197,94,.02)', filter:'blur(80px)', bottom:'20%', left:'5%', pointerEvents:'none' }} />

      {/* Logo + header */}
      <div style={{ textAlign:'center', marginBottom:56, position:'relative', zIndex:1 }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <div style={{ width:44, height:44, background:'linear-gradient(135deg,#f0b429,#d4780a)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:800, color:'#000', boxShadow:'0 4px 24px rgba(240,180,41,.35)' }}>N</div>
          <span style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.8px', color:'#f0f4f8' }}>Nexterm</span>
        </div>
        <p style={{ fontSize:13, color:'#4a5e72', letterSpacing:'0.3px' }}>Institutional FX Terminal — Select a module to continue</p>
      </div>

      {/* 3 cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, maxWidth:960, width:'100%', position:'relative', zIndex:1 }}>
        {MODULES.map(m => {
          const isHovered = hovered === m.id
          return (
            <div
              key={m.id}
              onClick={() => onEnter(m.id)}
              onMouseEnter={() => setHovered(m.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: '28px 24px',
                borderRadius: 14,
                background: isHovered ? m.bg : 'rgba(255,255,255,.03)',
                border: `1px solid ${isHovered ? m.border : 'rgba(255,255,255,.07)'}`,
                cursor: 'pointer',
                transition: 'all 200ms ease',
                transform: isHovered ? 'translateY(-4px)' : 'none',
                boxShadow: isHovered ? `0 12px 40px ${m.glow}` : '0 2px 12px rgba(0,0,0,.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
              }}
            >
              {/* Icon + title */}
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
                <div style={{ fontSize:32, lineHeight:1 }}>{m.icon}</div>
                <div style={{ width:8, height:8, borderRadius:'50%', background:m.color, boxShadow:`0 0 8px ${m.color}`, animation:'t-pulse 2s ease-in-out infinite' }} />
              </div>

              <div style={{ fontSize:17, fontWeight:700, color:'#f0f4f8', letterSpacing:'-0.3px', marginBottom:4 }}>{m.title}</div>
              <div style={{ fontSize:11, color:m.color, fontWeight:600, marginBottom:12, letterSpacing:'0.2px' }}>{m.subtitle}</div>

              <div style={{ fontSize:11, color:'#5a7080', marginBottom:16, lineHeight:1.6 }}>{m.desc}</div>

              {/* Stats */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:20 }}>
                {m.stats.map(s => (
                  <div key={s.label} style={{ padding:'8px 6px', borderRadius:6, background:'rgba(255,255,255,.03)', border:'0.5px solid rgba(255,255,255,.06)', textAlign:'center' }}>
                    <div style={{ fontSize:8, color:'#3d5060', letterSpacing:'0.4px', marginBottom:3, textTransform:'uppercase' }}>{s.label}</div>
                    <div style={{ fontSize:11, fontWeight:700, color:'#c8d6e5', fontFamily:'IBM Plex Mono, monospace' }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize:10, color:'#3d5060', lineHeight:1.5, marginBottom:20, minHeight:32 }}>{m.detail}</div>

              {/* CTA */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:16, borderTop:`0.5px solid ${isHovered ? m.border : 'rgba(255,255,255,.05)'}`, marginTop:'auto' }}>
                <span style={{ fontSize:11, fontWeight:600, color:isHovered ? m.color : '#5a7080', transition:'color 200ms' }}>Open module</span>
                <span style={{ fontSize:14, color:isHovered ? m.color : '#3d5060', transition:'all 200ms', transform: isHovered ? 'translateX(4px)' : 'none' }}>→</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom nav */}
      <div style={{ display:'flex', alignItems:'center', gap:16, marginTop:48, position:'relative', zIndex:1 }}>
        {[
          { tab:'newsplay' as TabId, label:'Event Trades' },
          { tab:'worldbook' as TabId, label:'Worldbook' },
          { tab:'yields' as TabId, label:'Yields' },
          { tab:'flows' as TabId, label:'Flows' },
          { tab:'copilot' as TabId, label:'AI Copilot' },
          { tab:'seasonality' as TabId, label:'Seasonality' },
        ].map(item => (
          <button key={item.tab} onClick={() => onEnter(item.tab)} style={{ padding:'6px 14px', borderRadius:6, fontSize:11, fontWeight:500, color:'#4a5e72', background:'transparent', border:'0.5px solid rgba(255,255,255,.07)', cursor:'pointer', transition:'all 150ms' }}
            onMouseEnter={e=>{ e.currentTarget.style.color='#c8d6e5'; e.currentTarget.style.borderColor='rgba(255,255,255,.15)' }}
            onMouseLeave={e=>{ e.currentTarget.style.color='#4a5e72'; e.currentTarget.style.borderColor='rgba(255,255,255,.07)' }}>
            {item.label}
          </button>
        ))}
      </div>

      <p style={{ marginTop:24, fontSize:10, color:'#2d3f50', position:'relative', zIndex:1 }}>
        No credit card required · 3-day free trial · All data live
      </p>
    </div>
  )
}

export default function TerminalPage() {
  const [entered, setEntered] = useState(false)
  const setActiveTab = useTerminalStore(s => s.setActiveTab)

  const handleEnter = (tab: TabId) => {
    setActiveTab(tab)
    setEntered(true)
  }

  if (!entered) return <DashboardHome onEnter={handleEnter} />
  return <TerminalLayout />
}
