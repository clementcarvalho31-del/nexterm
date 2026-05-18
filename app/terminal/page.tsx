'use client'
import { useState } from 'react'
import type { TabId } from '@/src/types'

const MODULES = [
  {
    id: 'calendar' as TabId,
    icon: '📅',
    title: 'Calendrier & News Macro',
    subtitle: 'Live macro events + news feed',
    desc: 'CPI · NFP · FOMC · ECB · GDP · PMI · Actualités macro en temps réel',
    detail: 'Countdown live, impact ★★★, news feed institutionnel, scénarios bull/bear',
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
    id: 'yields' as TabId,
    icon: '📉',
    title: 'Taux Futurs',
    subtitle: 'Prévisions de taux Fed · BCE · BOJ',
    desc: 'Futures de taux · Courbe forward · OIS · Probabilités de hike/cut',
    detail: 'Pricing du marché sur les prochaines réunions, courbe des taux implicites',
    color: '#38bdf8',
    glow: 'rgba(56,189,248,.2)',
    border: 'rgba(56,189,248,.25)',
    bg: 'rgba(56,189,248,.05)',
    stats: [
      { label: 'Fed Jun', value: 'Hold 92%' },
      { label: 'BCE Jul', value: '-25bp 68%' },
      { label: 'BOJ', value: 'Hold 81%' },
    ],
  },
  {
    id: 'seasonality' as TabId,
    icon: '🌀',
    title: 'Saisonnalité & Sentiment',
    subtitle: 'Retail positioning + patterns saisonniers',
    desc: 'Saisonnalité historique · Sentiment retail · COT · Biais directionnel',
    detail: 'Patterns 5/10/20 ans, positionnement retail vs institutionnel, biais mensuel',
    color: '#a855f7',
    glow: 'rgba(168,85,247,.2)',
    border: 'rgba(168,85,247,.25)',
    bg: 'rgba(168,85,247,.05)',
    stats: [
      { label: 'EUR/USD', value: '+63% haussier' },
      { label: 'Retail', value: '66% long' },
      { label: 'Saison', value: 'Mai bearish' },
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
      <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%', background:'rgba(240,180,41,.03)', filter:'blur(120px)', top:'30%', left:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', background:'rgba(239,68,68,.02)', filter:'blur(100px)', bottom:'10%', right:'10%', pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:'rgba(168,85,247,.02)', filter:'blur(80px)', bottom:'20%', left:'5%', pointerEvents:'none' }} />

      <div style={{ textAlign:'center', marginBottom:56, position:'relative', zIndex:1 }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <div style={{ width:44, height:44, background:'linear-gradient(135deg,#f0b429,#d4780a)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:800, color:'#000', boxShadow:'0 4px 24px rgba(240,180,41,.35)' }}>N</div>
          <span style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.8px', color:'#f0f4f8' }}>Nexterm</span>
        </div>
        <p style={{ fontSize:13, color:'#4a5e72', letterSpacing:'0.3px' }}>Institutional FX Terminal — Select a module to continue</p>
      </div>

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
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
                <div style={{ fontSize:32, lineHeight:1 }}>{m.icon}</div>
                <div style={{ width:8, height:8, borderRadius:'50%', background:m.color, boxShadow:`0 0 8px ${m.color}` }} />
              </div>

              <div style={{ fontSize:17, fontWeight:700, color:'#f0f4f8', letterSpacing:'-0.3px', marginBottom:4 }}>{m.title}</div>
              <div style={{ fontSize:11, color:m.color, fontWeight:600, marginBottom:12, letterSpacing:'0.2px' }}>{m.subtitle}</div>
              <div style={{ fontSize:11, color:'#5a7080', marginBottom:16, lineHeight:1.6 }}>{m.desc}</div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:20 }}>
                {m.stats.map(s => (
                  <div key={s.label} style={{ padding:'8px 6px', borderRadius:6, background:'rgba(255,255,255,.03)', border:'0.5px solid rgba(255,255,255,.06)', textAlign:'center' }}>
                    <div style={{ fontSize:8, color:'#3d5060', letterSpacing:'0.4px', marginBottom:3, textTransform:'uppercase' }}>{s.label}</div>
                    <div style={{ fontSize:11, fontWeight:700, color:'#c8d6e5', fontFamily:'IBM Plex Mono, monospace' }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize:10, color:'#3d5060', lineHeight:1.5, marginBottom:20, minHeight:32 }}>{m.detail}</div>

              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:16, borderTop:`0.5px solid ${isHovered ? m.border : 'rgba(255,255,255,.05)'}`, marginTop:'auto' }}>
                <span style={{ fontSize:11, fontWeight:600, color:isHovered ? m.color : '#5a7080', transition:'color 200ms' }}>Open module</span>
                <span style={{ fontSize:14, color:isHovered ? m.color : '#3d5060', transition:'all 200ms', transform: isHovered ? 'translateX(4px)' : 'none' }}>→</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function TerminalPage() {
  const [activeModule, setActiveModule] = useState<TabId | null>(null)

  if (activeModule) {
    return (
      <div style={{ minHeight:'100vh', background:'#080b10', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ color:'#4a5e72', fontSize:13 }}>— à coder —</div>
      </div>
    )
  }

  return <DashboardHome onEnter={setActiveModule} />
}
