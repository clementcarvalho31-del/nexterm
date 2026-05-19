'use client'
import { PanelShell } from '@/components/ui'
import { GLOBAL_YIELDS, YIELD_CURVE_POINTS, YIELD_SPREADS, CORRELATIONS } from '@/lib/data'

function YieldCurveSVG() {
  const pts = YIELD_CURVE_POINTS
  const minY = Math.min(...pts.map(p => p.yield))
  const maxY = Math.max(...pts.map(p => p.yield))
  const range = maxY - minY || 0.1
  const W=280,H=90,padL=8,padB=14,padT=6
  const coords = pts.map((p,i) => ({
    x: padL + (i/(pts.length-1))*(W-padL),
    y: padT + ((maxY-p.yield)/range)*(H-padT-padB),
  }))
  const pathD = coords.map((c,i)=>`${i===0?'M':'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
  const label = (p: typeof pts[0]) => 'maturityLabel' in p ? (p as any).maturityLabel : (p as any).label ?? ''
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:90}}>
      {[.25,.5,.75].map(f=><line key={f} x1={padL} x2={W} y1={padT+f*(H-padT-padB)} y2={padT+f*(H-padT-padB)} stroke="#131821" strokeWidth={.5}/>)}
      <path d={`${pathD} L${coords[coords.length-1].x},${H-padB} L${coords[0].x},${H-padB} Z`} fill="rgba(240,180,41,0.06)"/>
      <path d={pathD} stroke="#f0b429" strokeWidth={1.5} fill="none"/>
      {coords.map((c,i)=>(
        <g key={i}>
          <circle cx={c.x} cy={c.y} r={2.5} fill="#f0b429"/>
          <text x={c.x} y={H-2} fontSize={6} fill="#5a6373" textAnchor="middle">{label(pts[i])}</text>
        </g>
      ))}
      <text x={W-1} y={padT+4} fontSize={6} fill="#5a6373" textAnchor="end">{maxY.toFixed(2)}%</text>
      <text x={W-1} y={H-padB-1} fontSize={6} fill="#5a6373" textAnchor="end">{minY.toFixed(2)}%</text>
    </svg>
  )
}

export function YieldsPanel() {
  return (
    <div style={{overflow:'auto',height:'100%',padding:8,display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,alignContent:'start'}}>
      <PanelShell title="GLOBAL YIELDS">
        <div style={{padding:8}}>
          {GLOBAL_YIELDS.map(y=>{
            const chg = 'change' in y ? (y as any).change : 0
            const isUp = chg >= 0
            return (
              <div key={y.name} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'3px 0',borderBottom:'0.5px solid #131821'}}>
                <span style={{fontSize:10,color:'#e2e8f0'}}>{y.name}</span>
                <div style={{textAlign:'right'}}>
                  <span style={{fontSize:10,fontWeight:700,fontVariantNumeric:'tabular-nums',color:isUp?'#22c55e':'#ef4444'}}>{y.value.toFixed(2)}%</span>
                  <span style={{fontSize:9,marginLeft:4,color:isUp?'#22c55e':'#ef4444'}}>{isUp?'+':''}{chg.toFixed(2)}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </PanelShell>
      <PanelShell title="US YIELD CURVE">
        <div style={{padding:8}}>
          <YieldCurveSVG/>
          <p style={{fontSize:8,color:'#5a6373',marginTop:4}}>2Y-10Y inverted — recession signal active</p>
        </div>
      </PanelShell>
      <PanelShell title="KEY SPREADS">
        <div style={{padding:8,display:'grid',gridTemplateColumns:'1fr 1fr',gap:5}}>
          {YIELD_SPREADS.map(s=>{
            const sig = 'signal' in s ? (s as any).signal : ''
            const color = sig==='bearish'?'#ef4444':sig==='bullish'?'#22c55e':'#f0b429'
            const status = 'label' in s ? (s as any).label : (s as any).status ?? ''
            return (
              <div key={s.name} style={{background:'#131821',borderRadius:2,padding:8}}>
                <div style={{fontSize:9,color:'#5a6373',marginBottom:3}}>{s.name}</div>
                <div style={{fontSize:16,fontWeight:700,color,fontVariantNumeric:'tabular-nums'}}>{s.value>0?'+':''}{s.value.toFixed(2)}%</div>
                <div style={{fontSize:8,color,marginTop:2}}>{status}</div>
              </div>
            )
          })}
        </div>
      </PanelShell>
      <PanelShell title="INTER-MARKET CORR. (30D)">
        <div style={{padding:8}}>
          {CORRELATIONS.map(c=>{
            const coeff = 'coefficient' in c ? (c as any).coefficient : (c as any).correlation ?? 0
            const color = coeff>0?'#22c55e':'#ef4444'
            return (
              <div key={c.pair} style={{display:'flex',alignItems:'center',gap:6,marginBottom:7}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:9,color:'#8a9ab0'}}>{c.pair}</div>
                  <div style={{fontSize:8,color:'#5a6373'}}>{c.description}</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:4}}>
                  <div style={{width:50,height:3,background:'#131821',borderRadius:1,overflow:'hidden'}}>
                    <div style={{width:`${Math.abs(coeff)*100}%`,height:'100%',background:color,borderRadius:1}}/>
                  </div>
                  <span style={{fontSize:10,fontWeight:700,color,width:30,textAlign:'right',fontVariantNumeric:'tabular-nums'}}>{coeff.toFixed(2)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </PanelShell>
    </div>
  )
}
