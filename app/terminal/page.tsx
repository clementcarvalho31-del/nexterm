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
    glow: 'rgba(239,68,68,.25)',
    border: 'rgba(239,68,68,.3)',
    bg: 'rgba(239,68,68,.07)',
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
    glow: 'rgba(56,189,248,.25)',
    border: 'rgba(56,189,248,.3)',
    bg: 'rgba(56,189,248,.07)',
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
    glow: 'rgba(168,85,247,.25)',
    border: 'rgba(168,85,247,.3)',
    bg: 'rgba(168,85,247,.07)',
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
      fontFamily: "'Inter', -apple-system, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Image de fond */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'url(/hero-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.35,
        zIndex: 0,
      }} />
      {/* Overlay gradient */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to bottom, rgba(8,11,16,.7) 0%, rgba(8,11,16,.4) 40%, rgba(8,11,16,.85) 100%)',
        zIndex: 1,
      }} />

      {/* NAVBAR */}
      <nav style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 32px',
        borderBottom: '0.5px solid rgba(255,255,255,.08)',
        backdropFilter: 'blur(12px)',
        background: 'rgba(8,11,16,.5)',
      }}>
        {/* Logo / Home */}
        <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
          <div style={{ width:36, height:36, background:'linear-gradient(135deg,#f0b429,#d4780a)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, color:'#000', boxShadow:'0 4px 16px rgba(240,180,41,.4)' }}>N</div>
          <span style={{ fontSize:18, fontWeight:800, letterSpacing:'-0.5px', color:'#f0f4f8' }}>Nexterm</span>
          <span style={{ fontSize:10, color:'#3d5060', marginLeft:4, letterSpacing:'0.5px' }}>INSTITUTIONAL FX</span>
        </div>

        {/* Bouton connexion */}
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button style={{
            padding: '8px 18px',
            borderRadius: 7,
            fontSize: 12,
            fontWeight: 600,
            color: '#c8d6e5',
            background: 'transparent',
            border: '0.5px solid rgba(255,255,255,.15)',
            cursor: 'pointer',
            letterSpacing: '0.2px',
            transition: 'all 150ms',
          }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,.07)'; e.currentTarget.style.borderColor='rgba(255,255,255,.25)' }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='rgba(255,255,255,.15)' }}
          >
            Se connecter
          </button>
          <button style={{
            padding: '8px 18px',
            borderRadius: 7,
            fontSize: 12,
            fontWeight: 700,
            color: '#000',
            background: 'linear-gradient(135deg,#f0b429,#d4780a)',
            border: 'none',
            cursor: 'pointer',
            letterSpacing: '0.2px',
            boxShadow: '0 4px 16px rgba(240,180,41,.35)',
            transition: 'all 150ms',
          }}
            onMouseEnter={e => { e.currentTarget.style.opacity='0.9' }}
            onMouseLeave={e => { e.currentTarget.style.opacity='1' }}
          >
            Commencer
          </button>
        </div>
      </nav>

      {/* CONTENU PRINCIPAL */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        position: 'relative',
        zIndex: 2,
      }}>
        {/* Tagline */}
        <div style={{ textAlign:'center', marginBottom:52 }}>
          <p style={{ fontSize:12, color:'#f0b429', fontWeight:600, letterSpacing:'2px', textTransform:'uppercase', marginBottom:14 }}>Institutional FX Terminal</p>
          <h1 style={{ fontSize:38, fontWeight:800, color:'#f0f4f8', letterSpacing:'-1px', lineHeight:1.15, marginBottom:12 }}>
            Analyse macro de niveau<br />institutionnel
          </h1>
          <p style={{ fontSize:14, color:'#4a5e72', maxWidth:420, margin:'0 auto' }}>
            Calendrier, taux futurs, saisonnalité — tout ce qu'un trader institutionnel surveille, en un seul endroit.
          </p>
        </div>

        {/* 3 cartes */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, maxWidth:960, width:'100%' }}>
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
                  background: isHovered ? m.bg : 'rgba(8,11,16,.6)',
                  border: `1px solid ${isHovered ? m.border : 'rgba(255,255,255,.09)'}`,
                  backdropFilter: 'blur(16px)',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  transform: isHovered ? 'translateY(-4px)' : 'none',
                  boxShadow: isHovered ? `0 12px 40px ${m.glow}` : '0 2px 12px rgba(0,0,0,.4)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
                  <div style={{ fontSize:32, lineHeight:1 }}>{m.icon}</div>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:m.color, boxShadow:`0 0 8px ${m.color}` }} />
                </div>

                <div style={{ fontSize:17, fontWeight:700, color:'#f0f4f8', letterSpacing:'-0.3px', marginBottom:4 }}>{m.title}</div>
                <div style={{ fontSize:11, color:m.color, fontWeight:600, marginBottom:12 }}>{m.subtitle}</div>
                <div style={{ fontSize:11, color:'#5a7080', marginBottom:16, lineHeight:1.6 }}>{m.desc}</div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:20 }}>
                  {m.stats.map(s => (
                    <div key={s.label} style={{ padding:'8px 6px', borderRadius:6, background:'rgba(255,255,255,.04)', border:'0.5px solid rgba(255,255,255,.07)', textAlign:'center' }}>
                      <div style={{ fontSize:8, color:'#3d5060', letterSpacing:'0.4px', marginBottom:3, textTransform:'uppercase' }}>{s.label}</div>
                      <div style={{ fontSize:11, fontWeight:700, color:'#c8d6e5', fontFamily:'IBM Plex Mono, monospace' }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize:10, color:'#3d5060', lineHeight:1.5, marginBottom:20, minHeight:32 }}>{m.detail}</div>

                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:16, borderTop:`0.5px solid ${isHovered ? m.border : 'rgba(255,255,255,.06)'}`, marginTop:'auto' }}>
                  <span style={{ fontSize:11, fontWeight:600, color:isHovered ? m.color : '#5a7080', transition:'color 200ms' }}>Open module</span>
                  <span style={{ fontSize:14, color:isHovered ? m.color : '#3d5060', transition:'all 200ms', transform: isHovered ? 'translateX(4px)' : 'none' }}>→</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function TerminalPage() {
  const [activeModule, setActiveModule] = useState<TabId | null>(null)

  if (activeModule) {
    return (
      <div style={{ minHeight:'100vh', background:'#080b10', display:'flex', flexDirection:'column' }}>
        {/* Navbar avec Home */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 32px',
          borderBottom: '0.5px solid rgba(255,255,255,.08)',
          background: 'rgba(8,11,16,.95)',
        }}>
          <div onClick={() => setActiveModule(null)} style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
            <div style={{ width:36, height:36, background:'linear-gradient(135deg,#f0b429,#d4780a)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, color:'#000' }}>N</div>
            <span style={{ fontSize:18, fontWeight:800, color:'#f0f4f8' }}>Nexterm</span>
            <span style={{ fontSize:10, color:'#f0b429', marginLeft:8 }}>← Home</span>
          </div>
          <button style={{ padding:'8px 18px', borderRadius:7, fontSize:12, fontWeight:700, color:'#000', background:'linear-gradient(135deg,#f0b429,#d4780a)', border:'none', cursor:'pointer' }}>
            Se connecter
          </button>
        </nav>
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ color:'#4a5e72', fontSize:13 }}>— module à coder —</div>
        </div>
      </div>
    )
  }

  return <DashboardHome onEnter={setActiveModule} />
}
