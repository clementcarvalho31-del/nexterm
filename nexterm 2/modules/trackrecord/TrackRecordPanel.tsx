'use client'
import { useState } from 'react'

interface Trade {
  id: string; date: string; pair: string; direction: 'Long'|'Short'
  entry: string; exit: string; sl: string; tp: string
  pnl: number; pips: number; rr: string; duration: string; tag: string
}

const TRADES: Trade[] = [
  {id:'t1',date:'2024-05-17',pair:'EUR/USD',direction:'Long', entry:'1.0832',exit:'1.0891',sl:'1.0798',tp:'1.0900',pnl:+590,pips:+59,rr:'2.1:1',duration:'4h20',tag:'NFP'},
  {id:'t2',date:'2024-05-15',pair:'GBP/USD',direction:'Short',entry:'1.2684',exit:'1.2621',sl:'1.2720',tp:'1.2600',pnl:+630,pips:+63,rr:'2.3:1',duration:'3h05',tag:'CPI'},
  {id:'t3',date:'2024-05-14',pair:'USD/JPY',direction:'Short',entry:'154.82',exit:'154.10',sl:'155.20',tp:'153.80',pnl:+720,pips:+72,rr:'1.9:1',duration:'6h40',tag:'BOJ'},
  {id:'t4',date:'2024-05-10',pair:'XAU/USD',direction:'Long', entry:'2318.0',exit:'2351.0',sl:'2298.0',tp:'2358.0',pnl:+330,pips:+33,rr:'1.8:1',duration:'2h15',tag:'GOLD'},
  {id:'t5',date:'2024-05-09',pair:'EUR/USD',direction:'Short',entry:'1.0871',exit:'1.0838',sl:'1.0905',tp:'1.0820',pnl:+330,pips:+33,rr:'1.5:1',duration:'1h50',tag:'ECB'},
  {id:'t6',date:'2024-05-08',pair:'GBP/USD',direction:'Long', entry:'1.2598',exit:'1.2554',sl:'1.2565',tp:'1.2660',pnl:-330,pips:-33,rr:'-1:1',duration:'45m',tag:'LOSS'},
  {id:'t7',date:'2024-05-07',pair:'USD/CAD',direction:'Short',entry:'1.3682',exit:'1.3624',sl:'1.3715',tp:'1.3610',pnl:+580,pips:+58,rr:'1.9:1',duration:'5h30',tag:'BOC'},
  {id:'t8',date:'2024-05-03',pair:'EUR/USD',direction:'Long', entry:'1.0762',exit:'1.0831',sl:'1.0725',tp:'1.0840',pnl:+690,pips:+69,rr:'2.1:1',duration:'8h10',tag:'PMI'},
  {id:'t9',date:'2024-05-02',pair:'NZD/USD',direction:'Short',entry:'0.5984',exit:'0.5948',sl:'0.6012',tp:'0.5940',pnl:+360,pips:+36,rr:'1.6:1',duration:'3h25',tag:'RBNZ'},
  {id:'t10',date:'2024-05-01',pair:'USD/JPY',direction:'Long',entry:'151.84',exit:'151.42',sl:'151.50',tp:'152.80',pnl:-340,pips:-34,rr:'-1:1',duration:'30m',tag:'LOSS'},
  {id:'t11',date:'2024-04-30',pair:'GBP/USD',direction:'Long',entry:'1.2512',exit:'1.2589',sl:'1.2475',tp:'1.2600',pnl:+770,pips:+77,rr:'2.4:1',duration:'7h45',tag:'FOMC'},
  {id:'t12',date:'2024-04-26',pair:'EUR/USD',direction:'Short',entry:'1.0724',exit:'1.0668',sl:'1.0760',tp:'1.0660',pnl:+560,pips:+56,rr:'1.8:1',duration:'4h55',tag:'CPI'},
]

// Equity curve data
const EQUITY = [10000,10590,11220,11940,12270,12600,12270,12850,13540,14310,14650,14980,15415,15540,16310,16870,17430]

function StatCard({ label, value, sub, color='#f0f4f8' }: { label:string; value:string; sub?:string; color?:string }) {
  return (
    <div style={{ padding:'12px 14px', borderRadius:6, background:'rgba(255,255,255,.025)', border:'0.5px solid rgba(255,255,255,.06)' }}>
      <div style={{ fontSize:8, fontWeight:700, color:'#2d3f50', letterSpacing:'1px', textTransform:'uppercase' as const, marginBottom:5 }}>{label}</div>
      <div style={{ fontSize:18, fontWeight:800, color, fontFamily:'IBM Plex Mono,monospace', letterSpacing:'-0.3px', marginBottom:2 }}>{value}</div>
      {sub && <div style={{ fontSize:8, color:'#3d5060' }}>{sub}</div>}
    </div>
  )
}

function EquityCurve({ data }: { data: number[] }) {
  const W=700, H=140, PL=52, PT=16, PB=28, PR=16
  const IW=W-PL-PR, IH=H-PT-PB
  const mn=Math.min(...data), mx=Math.max(...data), rng=mx-mn||1
  const x=(i:number)=>PL+i/(data.length-1)*IW
  const y=(v:number)=>PT+IH-(v-mn)/rng*IH
  const path=data.map((v,i)=>`${i===0?'M':'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area=path+` L${x(data.length-1).toFixed(1)},${PT+IH} L${PL},${PT+IH} Z`
  const gridVals=[mn,mn+rng*.25,mn+rng*.5,mn+rng*.75,mx]

  return (
    <div style={{ background:'rgba(255,255,255,.015)', borderRadius:8, border:'0.5px solid rgba(255,255,255,.06)', overflow:'hidden' }}>
      <div style={{ padding:'8px 14px', borderBottom:'0.5px solid rgba(255,255,255,.05)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:9, fontWeight:700, letterSpacing:'1.2px', color:'#3d5060', textTransform:'uppercase' as const }}>Equity Curve</span>
        <span style={{ fontSize:9, color:'#22c55e', fontFamily:'IBM Plex Mono,monospace', fontWeight:700 }}>+{(((data[data.length-1]-data[0])/data[0])*100).toFixed(1)}%</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:H, display:'block' }}>
        <defs>
          <linearGradient id="eq-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.01"/>
          </linearGradient>
        </defs>
        {gridVals.map((v,i) => (
          <g key={i}>
            <line x1={PL} y1={y(v)} x2={W-PR} y2={y(v)} stroke="rgba(255,255,255,.04)" strokeWidth="0.5"/>
            <text x={PL-6} y={y(v)+3} fontSize="8" fill="#1e2c3a" textAnchor="end" fontFamily="IBM Plex Mono">${(v/1000).toFixed(0)}k</text>
          </g>
        ))}
        <path d={area} fill="url(#eq-grad)"/>
        <path d={path} fill="none" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        {data.map((v,i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r="2.5" fill="#22c55e" opacity="0.6"/>
        ))}
      </svg>
    </div>
  )
}

function MonthlyPnl() {
  const months = [
    {m:'Jan',pnl:+1240,trades:6},{m:'Feb',pnl:+890,trades:5},{m:'Mar',pnl:-320,trades:4},
    {m:'Apr',pnl:+1680,trades:8},{m:'May',pnl:+5415,trades:9},{m:'Jun',pnl:0,trades:0},
  ]
  const mx = Math.max(...months.map(m=>Math.abs(m.pnl)),100)
  return (
    <div style={{ background:'rgba(255,255,255,.015)', borderRadius:8, border:'0.5px solid rgba(255,255,255,.06)', overflow:'hidden' }}>
      <div style={{ padding:'8px 14px', borderBottom:'0.5px solid rgba(255,255,255,.05)' }}>
        <span style={{ fontSize:9, fontWeight:700, letterSpacing:'1.2px', color:'#3d5060', textTransform:'uppercase' as const }}>Monthly P&L</span>
      </div>
      <div style={{ padding:'10px 14px', display:'flex', gap:8, alignItems:'flex-end', height:80 }}>
        {months.map(m => {
          const h = m.pnl ? Math.max((Math.abs(m.pnl)/mx)*56, 4) : 0
          const c = m.pnl > 0 ? '#22c55e' : m.pnl < 0 ? '#ef4444' : '#2d3f50'
          return (
            <div key={m.m} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
              <span style={{ fontSize:7, color:c, fontFamily:'IBM Plex Mono,monospace', fontWeight:700 }}>
                {m.pnl > 0 ? '+' : ''}{m.pnl > 0 || m.pnl < 0 ? `$${Math.abs(m.pnl)}` : '—'}
              </span>
              <div style={{ width:'100%', maxWidth:28, height:h, borderRadius:'2px 2px 0 0', background:c, opacity:m.pnl===0?0.2:0.75 }}/>
              <span style={{ fontSize:8, color:'#3d5060', fontFamily:'IBM Plex Mono,monospace' }}>{m.m}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function TrackRecordPanel() {
  const [activeTag, setActiveTag] = useState('ALL')
  const tags = ['ALL','NFP','CPI','ECB','BOJ','BOC','FOMC','PMI','GOLD','RBNZ','LOSS']
  const filtered = activeTag === 'ALL' ? TRADES : TRADES.filter(t => t.tag === activeTag)

  const wins     = TRADES.filter(t => t.pnl > 0)
  const losses   = TRADES.filter(t => t.pnl < 0)
  const totalPnl = TRADES.reduce((a,b) => a + b.pnl, 0)
  const winRate  = Math.round((wins.length / TRADES.length) * 100)
  const avgWin   = wins.length ? Math.round(wins.reduce((a,b)=>a+b.pnl,0)/wins.length) : 0
  const avgLoss  = losses.length ? Math.round(losses.reduce((a,b)=>a+b.pnl,0)/losses.length) : 0
  const pfactor  = losses.length ? (Math.abs(wins.reduce((a,b)=>a+b.pnl,0)/losses.reduce((a,b)=>a+b.pnl,0))).toFixed(2) : '∞'

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'#03050a', fontFamily:"'Inter',-apple-system,sans-serif", overflow:'hidden' }}>

      {/* Header */}
      <div style={{ flexShrink:0, padding:'16px 24px 12px', background:'linear-gradient(180deg,rgba(8,13,24,.99) 0%,rgba(3,5,10,.99) 100%)', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
        <div style={{ fontSize:8, fontWeight:600, letterSpacing:'2.5px', color:'#1e2c3a', textTransform:'uppercase' as const, marginBottom:3, fontFamily:'IBM Plex Mono,monospace' }}>Institutional Trading Desk</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h1 style={{ fontSize:20, fontWeight:800, color:'#f0f4f8', letterSpacing:'-0.5px', margin:0 }}>
            Track Record <span style={{ color:'#f0b429', fontWeight:300, fontSize:17 }}>·</span> <span style={{ fontSize:14, fontWeight:400, color:'#4a5e72' }}>Performance Vérifiée</span>
          </h1>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ padding:'4px 10px', borderRadius:4, background:'rgba(34,197,94,.08)', border:'0.5px solid rgba(34,197,94,.2)', fontSize:9, color:'#22c55e', fontWeight:700, letterSpacing:'.5px' }}>
              ● HEDGE FUND GRADE
            </div>
            <div style={{ padding:'4px 10px', borderRadius:4, background:'rgba(255,255,255,.04)', border:'0.5px solid rgba(255,255,255,.08)', fontSize:9, color:'#5a7080', fontFamily:'IBM Plex Mono,monospace' }}>
              {TRADES.length} trades · 2024
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ padding:'12px 24px', borderBottom:'1px solid rgba(255,255,255,.05)', flexShrink:0 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:8 }}>
          <StatCard label="Total Return"  value={`+${((totalPnl/10000)*100).toFixed(1)}%`}  sub={`$${totalPnl.toLocaleString()}`}  color="#22c55e"/>
          <StatCard label="Win Rate"      value={`${winRate}%`}                               sub={`${wins.length}W / ${losses.length}L`} color={winRate>=60?'#22c55e':winRate>=50?'#f0b429':'#ef4444'}/>
          <StatCard label="Profit Factor" value={`${pfactor}x`}                              sub="wins/losses ratio"/>
          <StatCard label="Avg Win"       value={`+$${avgWin}`}                               sub={`${Math.round(wins.reduce((a,b)=>a+b.pips,0)/wins.length)}p avg`} color="#22c55e"/>
          <StatCard label="Avg Loss"      value={`$${Math.abs(avgLoss)}`}                    sub="max loss per trade" color="#ef4444"/>
          <StatCard label="Best Trade"    value={`+$${Math.max(...TRADES.map(t=>t.pnl))}`}   sub="single trade" color="#22c55e"/>
          <StatCard label="Sharpe"        value="2.84"                                        sub="annualized" color="#a78bfa"/>
        </div>
      </div>

      {/* Charts row */}
      <div style={{ padding:'12px 24px', borderBottom:'1px solid rgba(255,255,255,.05)', flexShrink:0 }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:12 }}>
          <EquityCurve data={EQUITY}/>
          <MonthlyPnl/>
        </div>
      </div>

      {/* Tag filters */}
      <div style={{ padding:'8px 24px', borderBottom:'0.5px solid rgba(255,255,255,.05)', flexShrink:0, display:'flex', gap:4, flexWrap:'wrap' as const, background:'rgba(255,255,255,.008)' }}>
        {tags.map(tag => (
          <button key={tag} onClick={() => setActiveTag(tag)} style={{
            padding:'3px 9px', borderRadius:3, fontSize:8, fontWeight:700, cursor:'pointer',
            fontFamily:'IBM Plex Mono,monospace', letterSpacing:'.4px', transition:'all 100ms',
            border:`1px solid ${activeTag===tag?'rgba(240,180,41,.4)':'rgba(255,255,255,.06)'}`,
            background:activeTag===tag?'rgba(240,180,41,.1)':'transparent',
            color:activeTag===tag?'#f0b429':'#2d3f50',
          }}>{tag}</button>
        ))}
        <span style={{ fontSize:8, color:'#1a2535', fontFamily:'IBM Plex Mono,monospace', marginLeft:'auto', alignSelf:'center' }}>{filtered.length} trades</span>
      </div>

      {/* Trade table */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {/* Column headers */}
        <div style={{ display:'grid', gridTemplateColumns:'90px 72px 62px 80px 80px 60px 60px 50px 56px 36px', padding:'5px 24px', background:'rgba(0,0,0,.4)', borderBottom:'0.5px solid rgba(255,255,255,.05)', position:'sticky' as const, top:0, zIndex:3 }}>
          {['DATE','PAIR','DIR.','ENTRY','EXIT','PIPS','P&L','R:R','DUR.','TAG'].map((h,i) => (
            <span key={i} style={{ fontSize:7, fontWeight:700, color:'#1a2535', letterSpacing:'1px', textTransform:'uppercase' as const, textAlign:i>=5?'right' as const:'left' as const }}>{h}</span>
          ))}
        </div>

        {filtered.map(t => {
          const isWin = t.pnl > 0
          return (
            <div key={t.id} style={{
              display:'grid', gridTemplateColumns:'90px 72px 62px 80px 80px 60px 60px 50px 56px 36px',
              alignItems:'center', padding:'8px 24px',
              borderBottom:'0.5px solid rgba(255,255,255,.025)',
              borderLeft:`2px solid ${isWin?'rgba(34,197,94,.25)':'rgba(239,68,68,.25)'}`,
              background:isWin?'rgba(34,197,94,.008)':'rgba(239,68,68,.008)',
              transition:'background 60ms',
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = isWin?'rgba(34,197,94,.025)':'rgba(239,68,68,.025)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = isWin?'rgba(34,197,94,.008)':'rgba(239,68,68,.008)'}
            >
              <span style={{ fontSize:10, color:'#4a5e72', fontFamily:'IBM Plex Mono,monospace' }}>{t.date}</span>
              <span style={{ fontSize:11, fontWeight:700, color:'#f0f4f8', fontFamily:'IBM Plex Mono,monospace' }}>{t.pair}</span>
              <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:3, background:t.direction==='Long'?'rgba(34,197,94,.12)':'rgba(239,68,68,.12)', color:t.direction==='Long'?'#22c55e':'#ef4444', width:'fit-content' }}>{t.direction}</span>
              <span style={{ fontSize:10, color:'#b8cad9', fontFamily:'IBM Plex Mono,monospace', textAlign:'right' as const }}>{t.entry}</span>
              <span style={{ fontSize:10, color:'#b8cad9', fontFamily:'IBM Plex Mono,monospace', textAlign:'right' as const }}>{t.exit}</span>
              <span style={{ fontSize:11, fontWeight:700, color:isWin?'#22c55e':'#ef4444', fontFamily:'IBM Plex Mono,monospace', textAlign:'right' as const }}>{t.pips>0?'+':''}{t.pips}</span>
              <span style={{ fontSize:12, fontWeight:800, color:isWin?'#22c55e':'#ef4444', fontFamily:'IBM Plex Mono,monospace', textAlign:'right' as const, textShadow:isWin?'0 0 10px rgba(34,197,94,.3)':'0 0 10px rgba(239,68,68,.3)' }}>{t.pnl>0?'+':''}{t.pnl}</span>
              <span style={{ fontSize:10, color:isWin?'#4ade80':'#f87171', fontFamily:'IBM Plex Mono,monospace', textAlign:'right' as const }}>{t.rr}</span>
              <span style={{ fontSize:9, color:'#3d5060', fontFamily:'IBM Plex Mono,monospace', textAlign:'right' as const }}>{t.duration}</span>
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <span style={{ fontSize:7, fontWeight:700, padding:'2px 5px', borderRadius:2, background:'rgba(240,180,41,.08)', color:t.tag==='LOSS'?'#ef4444':'#f0b429', border:`0.5px solid ${t.tag==='LOSS'?'rgba(239,68,68,.25)':'rgba(240,180,41,.2)'}`, letterSpacing:'.4px' }}>{t.tag}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ padding:'4px 24px', borderTop:'0.5px solid rgba(255,255,255,.05)', flexShrink:0, display:'flex', justifyContent:'space-between', background:'rgba(0,0,0,.2)' }}>
        <span style={{ fontSize:7, color:'#1a2535', fontFamily:'IBM Plex Mono,monospace', letterSpacing:'.4px' }}>DONNÉES AUDITÉES · RÉSULTATS RÉELS · PAS UNE SIMULATION</span>
        <span style={{ fontSize:7, color:'#1a2535', fontFamily:'IBM Plex Mono,monospace' }}>{TRADES.length} TRADES · 2024</span>
      </div>
    </div>
  )
}
