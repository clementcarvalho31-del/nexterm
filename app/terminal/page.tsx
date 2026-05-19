'use client'
import { useState, useEffect, useRef } from 'react'
import { TerminalLayout }  from '@/layouts/TerminalLayout'
import { useTerminalStore } from '@/store/terminal'
import { AccountMenu }     from '@/components/terminal/AccountMenu'
import type { TabId }      from '@/src/types'

type Lang = 'fr' | 'en'

// ── Animated ticker ──────────────────────────────────────────────────────────
function LiveTicker() {
  const [tick, setTick] = useState(0)
  useEffect(() => { const id = setInterval(() => setTick(t => t+1), 1400); return () => clearInterval(id) }, [])
  const prices = [
    { sym:'EUR/USD', val:(1.08432 + Math.sin(tick*0.3)*0.0022).toFixed(5), up:Math.sin(tick*0.3) > 0 },
    { sym:'GBP/USD', val:(1.26815 + Math.cos(tick*0.4)*0.0031).toFixed(5), up:Math.cos(tick*0.4) > 0 },
    { sym:'USD/JPY', val:(149.284 + Math.sin(tick*0.2)*0.09).toFixed(3),   up:Math.sin(tick*0.2) > 0 },
    { sym:'XAU/USD', val:(2318.4  + Math.cos(tick*0.5)*1.8).toFixed(1),    up:Math.cos(tick*0.5) > 0 },
    { sym:'DXY',     val:(104.32  + Math.sin(tick*0.35)*0.06).toFixed(3),   up:Math.sin(tick*0.35) > 0 },
  ]
  return (
    <div style={{ display:'flex', gap:4, padding:4, borderRadius:12, background:'rgba(255,255,255,.055)', border:'0.5px solid rgba(255,255,255,.1)', backdropFilter:'blur(20px)' }}>
      {prices.map(p => (
        <div key={p.sym} style={{ padding:'8px 16px', borderRadius:8, background:'rgba(255,255,255,.045)', display:'flex', flexDirection:'column', alignItems:'flex-start', gap:3, minWidth:86 }}>
          <span style={{ fontSize:9, color:'#6a7d8f', fontFamily:'IBM Plex Mono,monospace', letterSpacing:'.4px' }}>{p.sym}</span>
          <span style={{ fontSize:13, fontFamily:'IBM Plex Mono,monospace', fontVariantNumeric:'tabular-nums', fontWeight:600, color: p.up ? '#22c55e' : '#ef4444', transition:'color 300ms' }}>{p.val}</span>
        </div>
      ))}
    </div>
  )
}

// ── Intersection observer hook ──────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref  = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

// ── Animated section wrapper ─────────────────────────────────────────────────
function Reveal({ children, delay = 0, y = 28 }: { children: React.ReactNode; delay?: number; y?: number }) {
  const { ref, visible } = useInView()
  return (
    <div ref={ref} style={{
      opacity:    visible ? 1 : 0,
      transform:  visible ? 'translateY(0)' : `translateY(${y}px)`,
      transition: `opacity 0.65s cubic-bezier(.22,1,.36,1) ${delay}s, transform 0.65s cubic-bezier(.22,1,.36,1) ${delay}s`,
    }}>
      {children}
    </div>
  )
}

// ── Module card ──────────────────────────────────────────────────────────────
function ModuleCard({ m, delay, onEnter, lang }: { m:any; delay:number; onEnter:(t:TabId)=>void; lang:Lang }) {
  const [hov, setHov] = useState(false)
  const { ref, visible } = useInView(0.1)
  const open = lang === 'fr' ? 'Ouvrir le module' : 'Open module'
  return (
    <div ref={ref} onClick={() => onEnter(m.id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        opacity:    visible ? 1 : 0,
        transition: `opacity 0.6s cubic-bezier(.22,1,.36,1) ${delay}s, transform 0.6s cubic-bezier(.22,1,.36,1) ${delay}s, box-shadow 200ms, border-color 200ms, background 200ms`,
        padding: '26px 22px', borderRadius:16, cursor:'pointer',
        background: hov ? m.bg : 'rgba(255,255,255,.025)',
        border:     `1px solid ${hov ? m.border : 'rgba(255,255,255,.07)'}`,
        boxShadow:  hov ? `0 20px 60px ${m.glow}, 0 0 0 1px ${m.border}` : '0 2px 20px rgba(0,0,0,.4)',
        transform:  hov ? 'translateY(-6px) scale(1.005)' : (visible ? 'translateY(0)' : 'translateY(32px) scale(.97)'),
        display:'flex', flexDirection:'column',
      }}>
      {/* Top */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ fontSize:32, lineHeight:1 }}>{m.icon}</div>
        <span style={{ width:7, height:7, borderRadius:'50%', background:m.color, display:'inline-block', boxShadow:`0 0 10px ${m.color}`, animation:'t-pulse 2s ease-in-out infinite' }}/>
      </div>
      <div style={{ fontSize:17, fontWeight:700, color:'#f0f4f8', letterSpacing:'-.3px', marginBottom:4 }}>{m.title}</div>
      <div style={{ fontSize:11, color:m.color, fontWeight:600, marginBottom:12 }}>{m.subtitle}</div>
      <div style={{ fontSize:11, color:'#5a7080', lineHeight:1.65, marginBottom:14 }}>{m.desc}</div>
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:5, marginBottom:14 }}>
        {m.stats.map((s:any) => (
          <div key={s.label} style={{ padding:'7px 5px', borderRadius:7, background:'rgba(255,255,255,.04)', border:'0.5px solid rgba(255,255,255,.06)', textAlign:'center' }}>
            <div style={{ fontSize:7, color:'#3d5060', letterSpacing:'.4px', marginBottom:2, textTransform:'uppercase' }}>{s.label}</div>
            <div style={{ fontSize:10, fontWeight:700, color:'#c8d6e5', fontFamily:'IBM Plex Mono,monospace' }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize:10, color:'#3d5060', lineHeight:1.55, marginBottom:16, flex:1 }}>{m.detail}</div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:14, borderTop:`0.5px solid ${hov ? m.border : 'rgba(255,255,255,.05)'}`, transition:'border-color 200ms' }}>
        <span style={{ fontSize:12, fontWeight:700, color: hov ? m.color : '#8a9db5', transition:'color 200ms' }}>{open}</span>
        <span style={{ fontSize:14, color: hov ? m.color : '#3d5060', transition:'all 200ms', transform: hov ? 'translateX(4px)' : 'none' }}>→</span>
      </div>
    </div>
  )
}

// ── Dashboard home ────────────────────────────────────────────────────────────
function DashboardHome({ onEnter, lang, onLangChange }: { onEnter:(tab:TabId)=>void; lang:Lang; onLangChange:(l:Lang)=>void }) {

  const MODULES_FR = [
    { id:'calendar' as TabId, icon:'📅', title:'Calendrier & News Macro', subtitle:'Live macro events + news feed', desc:'CPI · NFP · FOMC · ECB · GDP · PMI · Actualités macro en temps réel', detail:'Countdown live, impact ★★★, scénarios bull/bear, news institutionnelles', color:'#ef4444', glow:'rgba(239,68,68,.2)', border:'rgba(239,68,68,.25)', bg:'rgba(239,68,68,.05)', stats:[{label:'This week',value:'12 events'},{label:'HIGH impact',value:'6'},{label:'Next',value:'NFP Fri'}] },
    { id:'yields'   as TabId, icon:'📊', title:'Taux Futurs',             subtitle:'Prévisions de taux Fed · BCE · BOJ', desc:'Futures de taux · Courbe forward · OIS · Probabilités de hike/cut', detail:'Pricing du marché sur les prochaines réunions, courbe des taux implicites', color:'#3b82f6', glow:'rgba(59,130,246,.2)', border:'rgba(59,130,246,.25)', bg:'rgba(59,130,246,.05)', stats:[{label:'FED Jun',value:'Hold 92%'},{label:'BCE Jul',value:'-25bp 68%'},{label:'BOJ',value:'Hold 81%'}] },
    { id:'cot'      as TabId, icon:'🌐', title:'Saisonnalité & Sentiment', subtitle:'Retail positioning + patterns saisonniers', desc:'Saisonnalité historique · Sentiment retail · COT · Biais directionnel', detail:'Patterns 5/10/20 ans, positionnement retail vs institutionnel, biais mensuel', color:'#a78bfa', glow:'rgba(167,139,250,.2)', border:'rgba(167,139,250,.25)', bg:'rgba(167,139,250,.05)', stats:[{label:'EUR/USD',value:'+63% haussier'},{label:'Retail',value:'66% long'},{label:'Saison',value:'Mai bearish'}] },
    { id:'livefeed' as TabId, icon:'⚡', title:'Live Feed', subtitle:'InvestingLive · Macro news en temps réel', desc:'Actualités live · Central banks · Forex · Commodities · Crypto · Session wrap', detail:'Même flux que InvestingLive, refresh 30s, filtres par catégorie, alertes importantes', color:'#f0b429', glow:'rgba(240,180,41,.2)', border:'rgba(240,180,41,.25)', bg:'rgba(240,180,41,.05)', stats:[{label:'Sources',value:'3 live'},{label:'Refresh',value:'30s'},{label:'Catégortes',value:'8'    }] },
  ]
  const MODULES_EN = [
    { id:'calendar' as TabId, icon:'📅', title:'Calendar & Macro News',    subtitle:'Live macro events + news feed', desc:'CPI · NFP · FOMC · ECB · GDP · PMI · Real-time macro news', detail:'Live countdown, ★★★ impact, bull/bear scenarios, institutional news', color:'#ef4444', glow:'rgba(239,68,68,.2)', border:'rgba(239,68,68,.25)', bg:'rgba(239,68,68,.05)', stats:[{label:'This week',value:'12 events'},{label:'HIGH impact',value:'6'},{label:'Next',value:'NFP Fri'}] },
    { id:'yields'   as TabId, icon:'📊', title:'Rate Futures',             subtitle:'Fed · ECB · BOJ forecasts', desc:'Rate futures · Forward curve · OIS · Hike/cut probabilities', detail:'Market pricing on upcoming meetings, implied rate curve', color:'#3b82f6', glow:'rgba(59,130,246,.2)', border:'rgba(59,130,246,.25)', bg:'rgba(59,130,246,.05)', stats:[{label:'FED Jun',value:'Hold 92%'},{label:'ECB Jul',value:'-25bp 68%'},{label:'BOJ',value:'Hold 81%'}] },
    { id:'cot'      as TabId, icon:'🌐', title:'Seasonality & Sentiment',  subtitle:'Retail positioning + seasonal patterns', desc:'Historical seasonality · Retail sentiment · COT · Directional bias', detail:'5/10/20yr patterns, retail vs institutional positioning, monthly bias', color:'#a78bfa', glow:'rgba(167,139,250,.2)', border:'rgba(167,139,250,.25)', bg:'rgba(167,139,250,.05)', stats:[{label:'EUR/USD',value:'+63% bullish'},{label:'Retail',value:'66% long'},{label:'Season',value:'May bearish'}] },
    { id:'livefeed' as TabId, icon:'⚡', title:'Live Feed',                subtitle:'InvestingLive · Real-time macro news', desc:'Live news · Central banks · Forex · Commodities · Crypto · Session wrap', detail:'Same feed as InvestingLive, 30s refresh, category filters, breaking alerts', color:'#f0b429', glow:'rgba(240,180,41,.2)', border:'rgba(240,180,41,.25)', bg:'rgba(240,180,41,.05)', stats:[{label:'Sources',value:'3 live'},{label:'Refresh',value:'30s'},{label:'Categories',value:'8'}] },
  ]

  const modules    = lang === 'fr' ? MODULES_FR : MODULES_EN
  const headline   = lang === 'fr' ? 'Analyse macro de niveau institutionnel' : 'Institutional-grade macro analysis'
  const sub        = lang === 'fr' ? "Calendrier, taux futurs, saisonnalité — tout ce qu'un trader institutionnel surveille, en un seul endroit." : 'Calendar, rate futures, seasonality — everything an institutional trader monitors, in one place.'

  const SECONDARY: {tab:TabId; fr:string; en:string}[] = [
    { tab:'newsplay',   fr:'Event Trades',  en:'Event Trades' },
    { tab:'worldbook',  fr:'Worldbook',     en:'Worldbook' },
    { tab:'dashboard',  fr:'Marchés',       en:'Markets' },
    { tab:'flows',      fr:'Flux',          en:'Flows' },
    { tab:'copilot',    fr:'AI Copilot',    en:'AI Copilot' },
    { tab:'seasonality',fr:'Saisonnalité',  en:'Seasonality' },
  ]

  // Hero entrance animation
  const [heroVisible, setHeroVisible] = useState(false)
  useEffect(() => { const id = setTimeout(() => setHeroVisible(true), 80); return () => clearTimeout(id) }, [])

  return (
    <div style={{ minHeight:'100vh', background:'#080b10', fontFamily:"'Inter',-apple-system,sans-serif", position:'relative', overflowY:'auto', overflowX:'hidden' }}>

      {/* ── Background ── */}
      <div style={{ position:'fixed', inset:0, backgroundImage:"url('/hero-bg.png')", backgroundSize:'cover', backgroundPosition:'center', pointerEvents:'none', zIndex:0 }}/>
      <div style={{ position:'fixed', inset:0, background:'linear-gradient(to bottom, rgba(8,11,16,.72) 0%, rgba(8,11,16,.55) 35%, rgba(8,11,16,.88) 70%, rgba(8,11,16,1) 100%)', pointerEvents:'none', zIndex:0 }}/>
      <div style={{ position:'fixed', inset:0, background:'radial-gradient(ellipse at 50% 0%, rgba(240,180,41,.04) 0%, transparent 65%)', pointerEvents:'none', zIndex:0 }}/>

      {/* ── Header ── */}
      <header style={{ position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px', height:60, borderBottom:'0.5px solid rgba(255,255,255,.07)', backdropFilter:'blur(24px)', background:'rgba(8,11,16,.82)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, background:'linear-gradient(135deg,#f0b429,#d4780a)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:800, color:'#000', boxShadow:'0 2px 14px rgba(240,180,41,.3)' }}>N</div>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:'#f0f4f8', letterSpacing:'-.3px', lineHeight:1.2 }}>Nexterm</div>
            <div style={{ fontSize:9, color:'#3d5060', letterSpacing:'.8px' }}>INSTITUTIONAL FX</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* Lang toggle */}
          <div style={{ display:'flex', gap:2, padding:3, borderRadius:7, background:'rgba(255,255,255,.06)', border:'0.5px solid rgba(255,255,255,.09)' }}>
            {(['fr','en'] as Lang[]).map(l => (
              <button key={l} onClick={() => onLangChange(l)} style={{ padding:'4px 10px', borderRadius:5, fontSize:10, fontWeight:600, background: lang===l ? 'rgba(240,180,41,.15)' : 'transparent', color: lang===l ? '#f0b429' : '#4a5e72', border:'none', cursor:'pointer', transition:'all 130ms', fontFamily:'inherit' }}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <AccountMenu lang={lang} onLangChange={onLangChange} />
        </div>
      </header>

      {/* ── Content (scrollable) ── */}
      <div style={{ position:'relative', zIndex:1 }}>

        {/* ── Hero section ── */}
        <section style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'110px 24px 80px', textAlign:'center' }}>

          {/* Badge */}
          <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(16px)', transition:'opacity 0.7s cubic-bezier(.22,1,.36,1) 0s, transform 0.7s cubic-bezier(.22,1,.36,1) 0s' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'5px 14px 5px 10px', borderRadius:100, background:'rgba(240,180,41,.09)', border:'0.5px solid rgba(240,180,41,.22)', marginBottom:28 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#f0b429', display:'inline-block', animation:'t-pulse 2s ease-in-out infinite' }}/>
              <span style={{ fontSize:11, color:'#f0b429', fontWeight:600, letterSpacing:'.5px' }}>INSTITUTIONAL FX TERMINAL</span>
            </div>
          </div>

          {/* Headline */}
          <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(24px)', transition:'opacity 0.75s cubic-bezier(.22,1,.36,1) 0.1s, transform 0.75s cubic-bezier(.22,1,.36,1) 0.1s', maxWidth:720, marginBottom:22 }}>
            <h1 style={{ fontSize:'clamp(34px,5.5vw,60px)', fontWeight:800, letterSpacing:'-2px', color:'#f0f4f8', lineHeight:1.1, margin:0 }}>
              {headline}
            </h1>
          </div>

          {/* Subheadline */}
          <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(20px)', transition:'opacity 0.75s cubic-bezier(.22,1,.36,1) 0.2s, transform 0.75s cubic-bezier(.22,1,.36,1) 0.2s', maxWidth:520, marginBottom:48 }}>
            <p style={{ fontSize:15, color:'#5a7080', lineHeight:1.7, margin:0 }}>{sub}</p>
          </div>

          {/* Live ticker */}
          <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(.97)', transition:'opacity 0.8s cubic-bezier(.22,1,.36,1) 0.35s, transform 0.8s cubic-bezier(.22,1,.36,1) 0.35s', marginBottom:16 }}>
            <LiveTicker />
          </div>

          {/* Scroll hint */}
          <div style={{ opacity: heroVisible ? 1 : 0, transition:'opacity 1s ease 1.2s', marginTop:56, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:9, color:'#2d3f50', letterSpacing:'1.5px', textTransform:'uppercase' }}>Scroll pour explorer</span>
            <div style={{ width:1, height:32, background:'linear-gradient(to bottom, #3d5060, transparent)' }}/>
          </div>
        </section>

        {/* ── Modules grid ── */}
        <section style={{ padding:'0 5vw 100px', maxWidth:1160, margin:'0 auto' }}>

          <Reveal delay={0}>
            <div style={{ textAlign:'center', marginBottom:52 }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'2px', color:'#3d5060', marginBottom:14, textTransform:'uppercase' }}>
                {lang === 'fr' ? 'Modules disponibles' : 'Available modules'}
              </div>
              <h2 style={{ fontSize:'clamp(26px,3.5vw,40px)', fontWeight:800, color:'#f0f4f8', letterSpacing:'-1px', margin:0 }}>
                {lang === 'fr' ? 'Tout ce dont un trader institutionnel a besoin' : 'Everything an institutional trader needs'}
              </h2>
            </div>
          </Reveal>

          {/* 2+2 grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:20, marginBottom:20 }}>
            {modules.slice(0, 2).map((m, i) => (
              <ModuleCard key={m.id} m={m} delay={i * 0.08} onEnter={onEnter} lang={lang} />
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:20 }}>
            {modules.slice(2, 4).map((m, i) => (
              <ModuleCard key={m.id} m={m} delay={i * 0.08 + 0.1} onEnter={onEnter} lang={lang} />
            ))}
          </div>
        </section>

        {/* ── Secondary nav ── */}
        <Reveal delay={0}>
          <section style={{ padding:'0 5vw 60px', display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:'1.5px', color:'#2d3f50', textTransform:'uppercase' }}>
              {lang === 'fr' ? 'Accès rapide' : 'Quick access'}
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
              {SECONDARY.map(item => (
                <button key={item.tab} onClick={() => onEnter(item.tab)} style={{ padding:'7px 16px', borderRadius:7, fontSize:11, fontWeight:500, color:'#4a5e72', background:'transparent', border:'0.5px solid rgba(255,255,255,.08)', cursor:'pointer', transition:'all 150ms', fontFamily:'inherit' }}
                  onMouseEnter={e => { e.currentTarget.style.color='#c8d6e5'; e.currentTarget.style.borderColor='rgba(255,255,255,.18)'; e.currentTarget.style.background='rgba(255,255,255,.04)' }}
                  onMouseLeave={e => { e.currentTarget.style.color='#4a5e72'; e.currentTarget.style.borderColor='rgba(255,255,255,.08)'; e.currentTarget.style.background='transparent' }}>
                  {item[lang]}
                </button>
              ))}
            </div>
            <p style={{ fontSize:10, color:'#1e2c3a', marginTop:4 }}>
              {lang === 'fr' ? 'Aucune carte requise · Essai 3 jours · Données live' : 'No credit card required · 3-day free trial · All data live'}
            </p>
          </section>
        </Reveal>

        {/* ── Why Nexterm ── */}
        <Reveal delay={0}>
          <section style={{ padding:'60px 5vw 80px', maxWidth:1080, margin:'0 auto', borderTop:'0.5px solid rgba(255,255,255,.05)' }}>
            <div style={{ textAlign:'center', marginBottom:48 }}>
              <h2 style={{ fontSize:'clamp(22px,3vw,34px)', fontWeight:800, color:'#f0f4f8', letterSpacing:'-.8px', margin:0, marginBottom:12 }}>
                {lang === 'fr' ? 'Conçu pour les traders sérieux' : 'Built for serious traders'}
              </h2>
              <p style={{ fontSize:14, color:'#4a5e72', lineHeight:1.7, margin:'0 auto', maxWidth:480 }}>
                {lang === 'fr' ? 'Pas un dashboard générique. Un vrai terminal institutionnel.' : 'Not a generic dashboard. A real institutional terminal.'}
              </p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
              {[
                { icon:'⚡', title: lang==='fr'?'Données live 30s':'30s live data', desc: lang==='fr'?'Refresh automatique sur tous les modules. Sentiment, news, calendrier — toujours à jour.':'Auto-refresh across all modules. Sentiment, news, calendar — always current.' },
                { icon:'🧠', title: lang==='fr'?'Signaux contrarians':'Contrarian signals', desc: lang==='fr'?'Détection automatique des crowds extrêmes. Signal contrarian généré en temps réel.':'Automatic extreme crowd detection. Contrarian signal generated in real time.' },
                { icon:'📊', title: lang==='fr'?'Saisonnalité 20 ans':'20yr seasonality', desc: lang==='fr'?'Patterns historiques sur 5/10/15/20 ans. Heatmap, trend line, statistiques avancées.':'Historical patterns over 5/10/15/20 years. Heatmap, trend line, advanced stats.' },
                { icon:'📰', title: lang==='fr'?'Feed institutionnel':'Institutional feed', desc: lang==='fr'?'InvestingLive + FinancialJuice + Reuters. Catégorisé, filtrable, en temps réel.':'InvestingLive + FinancialJuice + Reuters. Categorized, filterable, real-time.' },
                { icon:'🎯', title: lang==='fr'?'Event Trades':'Event Trades', desc: lang==='fr'?'Scénarios bull/bear/base sur chaque événement macro. Niveaux, levels, probabilités.':'Bull/bear/base scenarios for each macro event. Levels, targets, probabilities.' },
                { icon:'🔒', title: lang==='fr'?'Grade institutionnel':'Institutional grade', desc: lang==='fr'?'Bloomberg-quality. COT data, OIS pricing, sentiment retail — tout en un seul terminal.':'Bloomberg-quality. COT data, OIS pricing, retail sentiment — one terminal.' },
              ].map((f, i) => (
                <Reveal key={f.title} delay={i * 0.07}>
                  <div style={{ padding:'22px', borderRadius:12, background:'rgba(255,255,255,.025)', border:'0.5px solid rgba(255,255,255,.06)', transition:'all 200ms' }}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,.045)'; e.currentTarget.style.borderColor='rgba(255,255,255,.1)' }}
                    onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,.025)'; e.currentTarget.style.borderColor='rgba(255,255,255,.06)' }}>
                    <div style={{ fontSize:26, marginBottom:12 }}>{f.icon}</div>
                    <h3 style={{ fontSize:14, fontWeight:700, color:'#f0f4f8', letterSpacing:'-.2px', marginBottom:8 }}>{f.title}</h3>
                    <p style={{ fontSize:12, color:'#5a7080', lineHeight:1.65 }}>{f.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>
        </Reveal>

        {/* ── CTA strip ── */}
        <Reveal delay={0}>
          <section style={{ padding:'60px 5vw 80px', textAlign:'center' }}>
            <div style={{ maxWidth:540, margin:'0 auto', padding:'40px', borderRadius:20, background:'rgba(240,180,41,.05)', border:'1px solid rgba(240,180,41,.18)', position:'relative', overflowY:'auto', overflowX:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg, transparent, rgba(240,180,41,.5), transparent)' }}/>
              <div style={{ fontSize:26, marginBottom:12 }}>🚀</div>
              <h2 style={{ fontSize:24, fontWeight:800, color:'#f0f4f8', letterSpacing:'-.5px', marginBottom:10 }}>
                {lang==='fr' ? 'Commencer maintenant' : 'Get started now'}
              </h2>
              <p style={{ fontSize:13, color:'#5a7080', lineHeight:1.65, marginBottom:24 }}>
                {lang==='fr' ? 'Essai gratuit 3 jours. Sans carte bancaire.' : '3-day free trial. No credit card required.'}
              </p>
              <button onClick={() => onEnter('calendar')} style={{ padding:'12px 32px', borderRadius:8, background:'linear-gradient(135deg,#f0b429,#d4780a)', color:'#000', fontSize:13, fontWeight:700, border:'none', cursor:'pointer', boxShadow:'0 4px 20px rgba(240,180,41,.35)', transition:'all 160ms', fontFamily:'inherit' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(240,180,41,.45)' }}
                onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 4px 20px rgba(240,180,41,.35)' }}>
                {lang==='fr' ? 'Ouvrir le terminal →' : 'Open terminal →'}
              </button>
            </div>
          </section>
        </Reveal>

        {/* ── Footer ── */}
        <footer style={{ padding:'28px 5vw', borderTop:'0.5px solid rgba(255,255,255,.05)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:22, height:22, background:'linear-gradient(135deg,#f0b429,#d4780a)', borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#000' }}>N</div>
            <span style={{ fontSize:11, color:'#2d3f50' }}>© 2025 Nexterm. All rights reserved.</span>
          </div>
          <div style={{ display:'flex', gap:16 }}>
            {['Privacy','Terms','Contact'].map(l => (
              <a key={l} href="#" style={{ fontSize:11, color:'#2d3f50', textDecoration:'none' }}>{l}</a>
            ))}
          </div>
        </footer>
      </div>
    </div>
  )
}

// ── Page root ─────────────────────────────────────────────────────────────────
export default function TerminalPage() {
  const [entered, setEntered] = useState(false)
  const [lang, setLang]       = useState<Lang>('fr')
  const setActiveTab          = useTerminalStore(s => s.setActiveTab)

  const handleEnter = (tab: TabId) => {
    setActiveTab(tab)
    setEntered(true)
  }

  if (!entered) return <DashboardHome onEnter={handleEnter} lang={lang} onLangChange={setLang} />
  return <TerminalLayout />
}
