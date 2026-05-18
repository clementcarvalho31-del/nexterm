'use client'
import { useState } from 'react'
import { TerminalLayout } from '@/layouts/TerminalLayout'
import { useTerminalStore } from '@/store/terminal'
import { AccountMenu } from '@/components/terminal/AccountMenu'
import type { TabId } from '@/src/types'

type Lang = 'fr' | 'en'

const LABELS = {
  fr: {
    tagline: 'INSTITUTIONAL FX TERMINAL',
    headline: 'Analyse macro de niveau institutionnel',
    sub: 'Calendrier, taux futurs, saisonnalité — tout ce qu\'un trader institutionnel surveille, en un seul endroit.',
    open: 'Ouvrir le module',
    connect: 'Connexion',
    modules: [
      { id:'calendar' as TabId, icon:'📅', title:'Calendrier & News Macro', subtitle:'Live macro events + news feed', desc:'CPI · NFP · FOMC · ECB · GDP · PMI · Actualités macro en temps réel', detail:'Countdown live, impact ★★★, scénarios bull/bear, news institutionnelles', color:'#ef4444', glow:'rgba(239,68,68,.2)', border:'rgba(239,68,68,.25)', bg:'rgba(239,68,68,.05)', stats:[{label:'This week',value:'12 events'},{label:'HIGH impact',value:'6'},{label:'Next',value:'NFP Fri'}] },
      { id:'yields' as TabId, icon:'📊', title:'Taux Futurs', subtitle:'Prévisions de taux Fed · BCE · BOJ', desc:'Futures de taux · Courbe forward · OIS · Probabilités de hike/cut', detail:'Pricing du marché sur les prochaines réunions, courbe des taux implicites', color:'#3b82f6', glow:'rgba(59,130,246,.2)', border:'rgba(59,130,246,.25)', bg:'rgba(59,130,246,.05)', stats:[{label:'FED Jun',value:'Hold 92%'},{label:'BCE Jul',value:'-25bp 68%'},{label:'BOJ',value:'Hold 81%'}] },
      { id:'cot' as TabId, icon:'🌐', title:'Saisonnalité & Sentiment', subtitle:'Retail positioning + patterns saisonniers', desc:'Saisonnalité historique · Sentiment retail · COT · Biais directionnel', detail:'Patterns 5/10/20 ans, positionnement retail vs institutionnel, biais mensuel', color:'#a78bfa', glow:'rgba(167,139,250,.2)', border:'rgba(167,139,250,.25)', bg:'rgba(167,139,250,.05)', stats:[{label:'EUR/USD',value:'+63% haussier'},{label:'Retail',value:'66% long'},{label:'Saison',value:'Mai bearish'}] },
    ]
  },
  en: {
    tagline: 'INSTITUTIONAL FX TERMINAL',
    headline: 'Institutional-grade macro analysis',
    sub: 'Calendar, rate futures, seasonality — everything an institutional trader monitors, in one place.',
    open: 'Open module',
    connect: 'Sign in',
    modules: [
      { id:'calendar' as TabId, icon:'📅', title:'Calendar & Macro News', subtitle:'Live macro events + news feed', desc:'CPI · NFP · FOMC · ECB · GDP · PMI · Real-time macro news', detail:'Live countdown, ★★★ impact, bull/bear scenarios, institutional news', color:'#ef4444', glow:'rgba(239,68,68,.2)', border:'rgba(239,68,68,.25)', bg:'rgba(239,68,68,.05)', stats:[{label:'This week',value:'12 events'},{label:'HIGH impact',value:'6'},{label:'Next',value:'NFP Fri'}] },
      { id:'yields' as TabId, icon:'📊', title:'Rate Futures', subtitle:'Fed · ECB · BOJ forecasts', desc:'Rate futures · Forward curve · OIS · Hike/cut probabilities', detail:'Market pricing on upcoming meetings, implied rate curve', color:'#3b82f6', glow:'rgba(59,130,246,.2)', border:'rgba(59,130,246,.25)', bg:'rgba(59,130,246,.05)', stats:[{label:'FED Jun',value:'Hold 92%'},{label:'ECB Jul',value:'-25bp 68%'},{label:'BOJ',value:'Hold 81%'}] },
      { id:'cot' as TabId, icon:'🌐', title:'Seasonality & Sentiment', subtitle:'Retail positioning + seasonal patterns', desc:'Historical seasonality · Retail sentiment · COT · Directional bias', detail:'5/10/20yr patterns, retail vs institutional positioning, monthly bias', color:'#a78bfa', glow:'rgba(167,139,250,.2)', border:'rgba(167,139,250,.25)', bg:'rgba(167,139,250,.05)', stats:[{label:'EUR/USD',value:'+63% bullish'},{label:'Retail',value:'66% long'},{label:'Season',value:'May bearish'}] },
    ]
  }
}

function DashboardHome({ onEnter, lang, onLangChange }: { onEnter:(tab:TabId)=>void; lang:Lang; onLangChange:(l:Lang)=>void }) {
  const [hovered, setHovered] = useState<TabId|null>(null)
  const L = LABELS[lang]

  return (
    <div style={{ minHeight:'100vh', background:'#080b10', display:'flex', flexDirection:'column', fontFamily:"'Inter',-apple-system,sans-serif", position:'relative', overflow:'hidden' }}>
      {/* Ambient blobs */}
      <div style={{ position:'absolute', width:700, height:700, borderRadius:'50%', background:'rgba(240,180,41,.025)', filter:'blur(140px)', top:'20%', left:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', background:'rgba(239,68,68,.02)', filter:'blur(120px)', bottom:'5%', right:'5%', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', background:'rgba(167,139,250,.015)', filter:'blur(100px)', bottom:'15%', left:'5%', pointerEvents:'none' }}/>

      {/* Subtle grid */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.015) 1px,transparent 1px)', backgroundSize:'60px 60px', pointerEvents:'none' }}/>

      {/* ── Header ── */}
      <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px', height:60, borderBottom:'0.5px solid rgba(255,255,255,.06)', flexShrink:0, position:'relative', zIndex:10, backdropFilter:'blur(10px)', background:'rgba(8,11,16,.8)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
          <div style={{ width:34, height:34, background:'linear-gradient(135deg,#f0b429,#d4780a)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:800, color:'#000', boxShadow:'0 2px 12px rgba(240,180,41,.3)' }}>N</div>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:'#f0f4f8', letterSpacing:'-0.3px', lineHeight:1.2 }}>Nexterm</div>
            <div style={{ fontSize:9, color:'#3d5060', letterSpacing:'0.8px', fontWeight:500 }}>INSTITUTIONAL FX</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <AccountMenu lang={lang} onLangChange={onLangChange} />
        </div>
      </header>

      {/* ── Hero ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 24px 40px', position:'relative', zIndex:1 }}>
        <div style={{ textAlign:'center', marginBottom:64, maxWidth:680 }}>
          <div style={{ display:'inline-block', fontSize:10, fontWeight:700, letterSpacing:'2px', color:'#f0b429', marginBottom:20, padding:'4px 12px', borderRadius:20, background:'rgba(240,180,41,.08)', border:'0.5px solid rgba(240,180,41,.2)' }}>{L.tagline}</div>
          <h1 style={{ fontSize:42, fontWeight:800, color:'#f0f4f8', letterSpacing:'-1.2px', lineHeight:1.15, marginBottom:16 }}>{L.headline}</h1>
          <p style={{ fontSize:14, color:'#4a5e72', lineHeight:1.7 }}>{L.sub}</p>
        </div>

        {/* ── 3 Module cards ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, maxWidth:1000, width:'100%' }}>
          {L.modules.map(m => {
            const isHov = hovered === m.id
            return (
              <div key={m.id} onClick={() => onEnter(m.id)} onMouseEnter={() => setHovered(m.id)} onMouseLeave={() => setHovered(null)}
                style={{ padding:'26px 22px', borderRadius:14, background: isHov ? m.bg : 'rgba(255,255,255,.025)', border:`1px solid ${isHov ? m.border : 'rgba(255,255,255,.07)'}`, cursor:'pointer', transition:'all 200ms ease', transform: isHov ? 'translateY(-5px)' : 'none', boxShadow: isHov ? `0 16px 48px ${m.glow}` : '0 2px 16px rgba(0,0,0,.4)', display:'flex', flexDirection:'column' }}>

                {/* Top */}
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
                  <div style={{ fontSize:28, lineHeight:1 }}>{m.icon}</div>
                  <span style={{ width:7, height:7, borderRadius:'50%', background:m.color, display:'inline-block', boxShadow:`0 0 8px ${m.color}`, animation:'t-pulse 2s ease-in-out infinite' }}/>
                </div>

                <div style={{ fontSize:16, fontWeight:700, color:'#f0f4f8', letterSpacing:'-0.3px', marginBottom:4 }}>{m.title}</div>
                <div style={{ fontSize:11, color:m.color, fontWeight:600, marginBottom:12 }}>{m.subtitle}</div>
                <div style={{ fontSize:11, color:'#5a7080', marginBottom:14, lineHeight:1.6 }}>{m.desc}</div>

                {/* Stats */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:14 }}>
                  {m.stats.map(s => (
                    <div key={s.label} style={{ padding:'7px 5px', borderRadius:6, background:'rgba(255,255,255,.03)', border:'0.5px solid rgba(255,255,255,.05)', textAlign:'center' }}>
                      <div style={{ fontSize:7, color:'#3d5060', letterSpacing:'0.4px', marginBottom:2, textTransform:'uppercase' }}>{s.label}</div>
                      <div style={{ fontSize:10, fontWeight:700, color:'#c8d6e5', fontFamily:'IBM Plex Mono,monospace', lineHeight:1.3 }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize:10, color:'#3d5060', lineHeight:1.5, marginBottom:16, flex:1 }}>{m.detail}</div>

                {/* CTA */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:14, borderTop:`0.5px solid ${isHov ? m.border : 'rgba(255,255,255,.05)'}` }}>
                  <span style={{ fontSize:11, fontWeight:600, color: isHov ? m.color : '#5a7080', transition:'color 200ms' }}>{L.open}</span>
                  <span style={{ fontSize:13, color: isHov ? m.color : '#3d5060', transition:'all 200ms', transform: isHov ? 'translateX(4px)' : 'none' }}>→</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Secondary nav */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:40, flexWrap:'wrap', justifyContent:'center' }}>
          {([
            { tab:'newsplay', fr:'Event Trades', en:'Event Trades' },
            { tab:'worldbook', fr:'Worldbook', en:'Worldbook' },
            { tab:'dashboard', fr:'Marchés', en:'Markets' },
            { tab:'flows', fr:'Flux', en:'Flows' },
            { tab:'copilot', fr:'AI Copilot', en:'AI Copilot' },
            { tab:'seasonality', fr:'Saisonnalité', en:'Seasonality' },
          ] as {tab:TabId;fr:string;en:string}[]).map(item => (
            <button key={item.tab} onClick={() => onEnter(item.tab)}
              style={{ padding:'6px 14px', borderRadius:6, fontSize:11, fontWeight:500, color:'#4a5e72', background:'transparent', border:'0.5px solid rgba(255,255,255,.07)', cursor:'pointer', transition:'all 150ms', fontFamily:'inherit' }}
              onMouseEnter={e=>{ e.currentTarget.style.color='#c8d6e5'; e.currentTarget.style.borderColor='rgba(255,255,255,.15)' }}
              onMouseLeave={e=>{ e.currentTarget.style.color='#4a5e72'; e.currentTarget.style.borderColor='rgba(255,255,255,.07)' }}>
              {item[lang]}
            </button>
          ))}
        </div>

        <p style={{ marginTop:24, fontSize:10, color:'#2d3f50' }}>No credit card required · 3-day free trial · All data live</p>
      </div>
    </div>
  )
}

export default function TerminalPage() {
  const [entered, setEntered]     = useState(false)
  const [lang, setLang]           = useState<Lang>('fr')
  const setActiveTab              = useTerminalStore(s => s.setActiveTab)

  const handleEnter = (tab: TabId) => {
    setActiveTab(tab)
    setEntered(true)
  }

  if (!entered) return <DashboardHome onEnter={handleEnter} lang={lang} onLangChange={setLang} />
  return <TerminalLayout />
}
