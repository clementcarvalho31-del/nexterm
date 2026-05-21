'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const FEATURES = [
  { icon:'📊', title:'Realtime Charts',       desc:'TradingView-grade charting with KlineCharts for live WebSocket data.' },
  { icon:'🌍', title:'Macro Intelligence',    desc:'COT positioning, yield curves, central bank biais, and DXM sentiment.' },
  { icon:'📰', title:'Institutional News',    desc:'Macro news feed with audio squawk, event trading scenarios, and NFP/CPI playbooks.' },
  { icon:'🤖', title:'AI Copilot',            desc:'Claude-powered market analyst with live context. Ask anything institutional.' },
  { icon:'💹', title:'Multi-Chart Workspace', desc:'Bloomberg-style draggable panels with custom layouts and persistence.' },
  { icon:'⚡', title:'Low Latency',           desc:'WebSocket streaming, 250ms flush cycles, optimised for serious traders.' },
]

const PRICING = [
  { name:'Trial',   price:'Free',   sub:'3 days',   cta:'Start free', features:['Full terminal access','All chart tools','AI Copilot (limited)','COT & macro data'], accent:false },
  { name:'Pro',     price:'$49',    sub:'per month', cta:'Start trial', features:['Everything in Trial','Unlimited AI Copilot','Saved workspaces','Priority data feeds','Custom indicators'], accent:true },
  { name:'Team',    price:'$149',   sub:'per month', cta:'Contact us',  features:['Up to 5 seats','Shared watchlists','Admin dashboard','Custom integrations','SLA support'], accent:false },
]

function Blob({ style }: { style: React.CSSProperties }) {
  return <div style={{ position:'absolute', borderRadius:'50%', filter:'blur(80px)', pointerEvents:'none', ...style }} />
}

export default function LandingPage() {
  const [tick, setTick] = useState(0)
  useEffect(() => { const id = setInterval(()=>setTick(t=>t+1), 1200); return ()=>clearInterval(id) }, [])

  const prices = [
    { sym:'EUR/USD', val:(1.08432 + Math.sin(tick*0.3)*0.002).toFixed(5), up:Math.sin(tick*0.3)>0 },
    { sym:'GBP/USD', val:(1.26815 + Math.cos(tick*0.4)*0.003).toFixed(5), up:Math.cos(tick*0.4)>0 },
    { sym:'USD/JPY', val:(149.284 + Math.sin(tick*0.2)*0.08).toFixed(3),  up:Math.sin(tick*0.2)>0 },
    { sym:'DXY',     val:(104.32  + Math.cos(tick*0.5)*0.05).toFixed(3),  up:Math.cos(tick*0.5)>0 },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'#080b10', color:'#c8d6e5', fontFamily:"'Inter',-apple-system,sans-serif", overflowY:'auto', overflowX:'hidden' }}>

      {/* ── Navbar ── */}
      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px', height:60, borderBottom:'0.5px solid rgba(255,255,255,.06)', position:'sticky', top:0, zIndex:50, background:'rgba(8,11,16,.9)', backdropFilter:'blur(20px)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:28, height:28, background:'linear-gradient(135deg,#f0b429,#d4780a)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#000' }}>N</div>
          <span style={{ fontWeight:700, fontSize:16, letterSpacing:'-0.4px', color:'#f0f4f8' }}>PrimeMarket</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:24 }}>
          {['Features','Pricing','Docs'].map(l=>(
            <a key={l} href={`#${l.toLowerCase()}`} style={{ fontSize:13, color:'#7a8fa8', textDecoration:'none', transition:'color 120ms', cursor:'pointer' }}
              onMouseEnter={e=>e.currentTarget.style.color='#c8d6e5'} onMouseLeave={e=>e.currentTarget.style.color='#7a8fa8'}>{l}</a>
          ))}
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <Link href="/login" style={{ padding:'7px 16px', borderRadius:6, border:'0.5px solid rgba(255,255,255,.15)', color:'#c8d6e5', fontSize:13, fontWeight:500, textDecoration:'none', transition:'all 120ms', background:'transparent' }}
            onMouseEnter={(e:any)=>e.currentTarget.style.borderColor='rgba(255,255,255,.3)'}
            onMouseLeave={(e:any)=>e.currentTarget.style.borderColor='rgba(255,255,255,.15)'}>Log in</Link>
          <Link href="/signup" style={{ padding:'7px 16px', borderRadius:6, background:'linear-gradient(135deg,#f0b429,#d4780a)', color:'#000', fontSize:13, fontWeight:700, textDecoration:'none', boxShadow:'0 2px 12px rgba(240,180,41,.3)', transition:'all 120ms' }}
            onMouseEnter={(e:any)=>e.currentTarget.style.transform='translateY(-1px)'}
            onMouseLeave={(e:any)=>e.currentTarget.style.transform='none'}>Start free trial</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ position:'relative', padding:'120px 32px 100px', textAlign:'center', overflow:'hidden' }}>
        {/* Hero background — candlestick SVG */}
        <div style={{ position:'absolute', inset:0, zIndex:0, overflow:'hidden' }}>
          <svg width="100%" height="100%" viewBox="0 0 1400 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bg-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f1923"/>
                <stop offset="100%" stopColor="#080b10"/>
              </linearGradient>
            </defs>
            <rect width="1400" height="600" fill="url(#bg-grad)"/>
            {/* Grid lines */}
            {[100,200,300,400,500].map(y=><line key={y} x1="0" y1={y} x2="1400" y2={y} stroke="rgba(255,255,255,.03)" strokeWidth="1"/>)}
            {[0,100,200,300,400,500,600,700,800,900,1000,1100,1200,1300].map(x=><line key={x} x1={x} y1="0" x2={x} y2="600" stroke="rgba(255,255,255,.02)" strokeWidth="1"/>)}
            {/* Candlesticks — bearish red */}
            {[[60,180,220,140],[120,240,280,200],[180,200,250,160],[240,280,320,260],[300,260,310,220],[360,300,350,270],[420,280,330,250],[480,310,360,290],[540,290,340,260],[600,320,370,300]].map(([x,open,high,low],i)=>(
              <g key={i} opacity="0.35">
                <line x1={x} y1={high} x2={x} y2={low} stroke="#ef4444" strokeWidth="1.5"/>
                <rect x={x-8} y={Math.min(open,low)} width="16" height={Math.abs(open-low)||4} fill="#ef4444" rx="1"/>
              </g>
            ))}
            {/* Candlesticks — bullish green */}
            {[[660,340,280,360],[720,300,250,320],[780,270,210,300],[840,250,190,280],[900,230,170,260],[960,210,150,240],[1020,190,130,220],[1080,170,110,200],[1140,150,90,180],[1200,130,70,160],[1260,110,50,140],[1320,90,30,120]].map(([x,open,low,high],i)=>(
              <g key={i} opacity="0.35">
                <line x1={x} y1={low} x2={x} y2={high} stroke="#22c55e" strokeWidth="1.5"/>
                <rect x={x-8} y={Math.min(open,high)} width="16" height={Math.abs(open-high)||4} fill="#22c55e" rx="1"/>
              </g>
            ))}
            {/* Moving average line */}
            <polyline points="60,200 160,220 260,290 360,310 460,295 560,310 660,320 760,280 860,240 960,200 1060,170 1160,140 1260,110 1360,85" fill="none" stroke="rgba(240,180,41,.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            {/* Second MA */}
            <polyline points="60,250 160,265 260,310 360,340 460,330 560,345 660,355 760,320 860,280 960,240 1060,205 1160,175 1260,145 1360,115" fill="none" stroke="rgba(59,130,246,.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 4"/>
            {/* Glow orbs */}
            <circle cx="700" cy="300" r="250" fill="rgba(240,180,41,.04)"/>
            <circle cx="1100" cy="200" r="150" fill="rgba(34,197,94,.03)"/>
            <circle cx="300" cy="350" r="180" fill="rgba(239,68,68,.03)"/>
          </svg>
        </div>
        {/* Dark overlay — keeps text readable */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(8,11,16,.55) 0%, rgba(8,11,16,.3) 40%, rgba(8,11,16,.75) 75%, rgba(8,11,16,1) 100%)', zIndex:1 }} />
        {/* Extra side vignette */}
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at center, transparent 30%, rgba(8,11,16,.5) 100%)', zIndex:1 }} />

        <div style={{ position:'relative', zIndex:2 }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'5px 12px 5px 8px', borderRadius:100, background:'rgba(240,180,41,.1)', border:'0.5px solid rgba(240,180,41,.25)', marginBottom:24 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#f0b429', animation:'t-pulse 2s ease-in-out infinite', display:'inline-block' }} />
          <span style={{ fontSize:12, color:'#f0b429', fontWeight:500 }}>Now with AI Copilot powered by Claude</span>
        </div>

        <h1 style={{ fontSize:'clamp(36px,5vw,64px)', fontWeight:800, letterSpacing:'-2px', color:'#f0f4f8', lineHeight:1.1, marginBottom:20, maxWidth:760, margin:'0 auto 20px' }}>
          The institutional-grade<br />
          <span style={{ background:'linear-gradient(135deg,#f0b429,#d4780a)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>FX terminal</span>
          {' '}for serious traders
        </h1>

        <p style={{ fontSize:17, color:'#7a8fa8', maxWidth:520, margin:'0 auto 40px', lineHeight:1.65 }}>
          Bloomberg-quality macroeconomic analysis, real-time charts, AI market intelligence, and institutional data feeds — in one terminal.
        </p>

        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <Link href="/signup" style={{ padding:'12px 28px', borderRadius:8, background:'linear-gradient(135deg,#f0b429,#d4780a)', color:'#000', fontSize:14, fontWeight:700, textDecoration:'none', boxShadow:'0 4px 20px rgba(240,180,41,.35)', transition:'all 150ms' }}
            onMouseEnter={(e:any)=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 30px rgba(240,180,41,.45)'}}
            onMouseLeave={(e:any)=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 4px 20px rgba(240,180,41,.35)'}}>
            Start 3-day free trial →
          </Link>
          <Link href="/login" style={{ padding:'12px 28px', borderRadius:8, border:'0.5px solid rgba(255,255,255,.15)', color:'#c8d6e5', fontSize:14, fontWeight:500, textDecoration:'none', transition:'all 150ms' }}
            onMouseEnter={(e:any)=>e.currentTarget.style.borderColor='rgba(255,255,255,.3)'}
            onMouseLeave={(e:any)=>e.currentTarget.style.borderColor='rgba(255,255,255,.15)'}>
            Se connecter
          </Link>
        </div>

        {/* Live ticker preview */}
        <div style={{ marginTop:60, display:'inline-flex', gap:3, padding:4, borderRadius:10, background:'rgba(255,255,255,.06)', border:'0.5px solid rgba(255,255,255,.12)', backdropFilter:'blur(12px)' }}>
          {prices.map(p=>(
            <div key={p.sym} style={{ padding:'8px 16px', borderRadius:7, background:'rgba(255,255,255,.04)', display:'flex', flexDirection:'column', alignItems:'flex-start', gap:3 }}>
              <span style={{ fontSize:10, color:'#8a9db5', fontFamily:"'IBM Plex Mono',monospace", letterSpacing:'0.3px' }}>{p.sym}</span>
              <span style={{ fontSize:13, fontFamily:"'IBM Plex Mono',monospace", fontVariantNumeric:'tabular-nums', fontWeight:600, color:p.up?'#22c55e':'#ef4444' }}>{p.val}</span>
            </div>
          ))}
        </div>
        </div>{/* end z-index wrapper */}
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding:'80px 32px', maxWidth:1100, margin:'0 auto' }}>
        <h2 style={{ fontSize:32, fontWeight:800, letterSpacing:'-1px', color:'#f0f4f8', textAlign:'center', marginBottom:12 }}>Everything a macro trader needs</h2>
        <p style={{ textAlign:'center', color:'#7a8fa8', fontSize:15, marginBottom:56 }}>Built for FX traders who think in terms of macro flows, not just candlesticks.</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
          {FEATURES.map(f=>(
            <div key={f.title} style={{ padding:24, borderRadius:10, background:'rgba(255,255,255,.03)', border:'0.5px solid rgba(255,255,255,.07)', transition:'all 200ms' }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,.05)';e.currentTarget.style.borderColor='rgba(255,255,255,.12)'}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,.03)';e.currentTarget.style.borderColor='rgba(255,255,255,.07)'}}>
              <div style={{ fontSize:28, marginBottom:12 }}>{f.icon}</div>
              <h3 style={{ fontSize:15, fontWeight:700, color:'#f0f4f8', marginBottom:8, letterSpacing:'-0.2px' }}>{f.title}</h3>
              <p style={{ fontSize:13, color:'#6a7d90', lineHeight:1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ padding:'80px 32px', maxWidth:900, margin:'0 auto' }}>
        <h2 style={{ fontSize:32, fontWeight:800, letterSpacing:'-1px', color:'#f0f4f8', textAlign:'center', marginBottom:12 }}>Simple, transparent pricing</h2>
        <p style={{ textAlign:'center', color:'#7a8fa8', fontSize:15, marginBottom:56 }}>3-day free trial. No credit card required to start.</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
          {PRICING.map(plan=>(
            <div key={plan.name} style={{ padding:28, borderRadius:12, background:plan.accent?'rgba(240,180,41,.07)':'rgba(255,255,255,.03)', border:`0.5px solid ${plan.accent?'rgba(240,180,41,.35)':'rgba(255,255,255,.07)'}`, position:'relative', overflow:'hidden' }}>
              {plan.accent && <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,#f0b429,#d4780a)' }} />}
              {plan.accent && <div style={{ display:'inline-block', padding:'2px 8px', borderRadius:100, background:'rgba(240,180,41,.15)', color:'#f0b429', fontSize:10, fontWeight:700, marginBottom:12, letterSpacing:'0.5px' }}>MOST POPULAR</div>}
              <div style={{ fontSize:13, fontWeight:600, color:'#7a8fa8', marginBottom:8 }}>{plan.name}</div>
              <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:4 }}>
                <span style={{ fontSize:36, fontWeight:800, color:'#f0f4f8', letterSpacing:'-1px' }}>{plan.price}</span>
                {plan.sub && <span style={{ fontSize:13, color:'#4a5e72' }}>/{plan.sub}</span>}
              </div>
              <div style={{ margin:'20px 0', height:'0.5px', background:'rgba(255,255,255,.06)' }} />
              <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:8, marginBottom:24 }}>
                {plan.features.map(f=>(
                  <li key={f} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#8a9db5' }}>
                    <span style={{ color:'#22c55e', fontSize:12 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" style={{ display:'block', textAlign:'center', padding:'10px 20px', borderRadius:7, background:plan.accent?'linear-gradient(135deg,#f0b429,#d4780a)':'transparent', border:plan.accent?'none':'0.5px solid rgba(255,255,255,.15)', color:plan.accent?'#000':'#c8d6e5', fontSize:13, fontWeight:700, textDecoration:'none', transition:'all 150ms' }}
                onMouseEnter={(e:any)=>{if(!plan.accent){e.currentTarget.style.borderColor='rgba(255,255,255,.3)'}}}
                onMouseLeave={(e:any)=>{if(!plan.accent){e.currentTarget.style.borderColor='rgba(255,255,255,.15)'}}}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding:'40px 32px', borderTop:'0.5px solid rgba(255,255,255,.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:22, height:22, background:'linear-gradient(135deg,#f0b429,#d4780a)', borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#000' }}>N</div>
          <span style={{ fontSize:13, color:'#4a5e72' }}>© 2025 PrimeMarket. All rights reserved.</span>
        </div>
        <div style={{ display:'flex', gap:20 }}>
          {['Privacy','Terms','Contact'].map(l=>(
            <a key={l} href="#" style={{ fontSize:12, color:'#4a5e72', textDecoration:'none' }}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  )
}
