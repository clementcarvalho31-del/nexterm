'use client'
import { PanelShell, BankBiasChip, BarMeter, BiasChip, KVRow } from '@/components/ui'
import {
  BANK_RESEARCH, SENTIMENT_DATA, PROP_INDICATORS, PAIR_BIASES,
  MACRO_ASSETS, CORRELATIONS,
} from '@/lib/data'

function MacroRadarPanel() {
  return (
    <PanelShell title="MACRO RADAR">
      <div style={{ padding:8 }}>
        {MACRO_ASSETS.map(a => (
          <div key={a.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'3px 0', borderBottom:'0.5px solid #131821' }}>
            <span style={{ fontSize:10, color:'#e2e8f0' }}>{a.name}</span>
            <div style={{ textAlign:'right' }}>
              <span style={{ fontSize:10, fontWeight:700, fontVariantNumeric:'tabular-nums', color:a.direction==='up'?'#22c55e':'#ef4444' }}>{a.value}</span>
              <span style={{ fontSize:9, marginLeft:4, color:a.direction==='up'?'#22c55e':'#ef4444' }}>{a.changePct}</span>
            </div>
          </div>
        ))}
      </div>
    </PanelShell>
  )
}

function BankResearchPanel() {
  return (
    <PanelShell title="BANK RESEARCH" action="FILTER">
      <div>
        {BANK_RESEARCH.map(b => (
          <div
            key={`${b.bank}-${b.pair}`}
            style={{ padding:'5px 8px', borderBottom:'0.5px solid #1e2530', cursor:'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background='#131821')}
            onMouseLeave={e => (e.currentTarget.style.background='transparent')}
          >
            <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:2 }}>
              <span style={{ fontSize:9, color:'#f0b429' }}>{b.bank}</span>
              <span style={{ fontSize:9, color:'#5a6373', marginLeft:'auto', marginRight:4 }}>{b.pair}</span>
              <BankBiasChip direction={b.direction} />
            </div>
            <div style={{ fontSize:9, color:'#8a9ab0', lineHeight:1.3 }}>{b.view}</div>
          </div>
        ))}
      </div>
    </PanelShell>
  )
}

function CorrelationsPanel() {
  return (
    <PanelShell title="INTER-MARKET (30D)">
      <div style={{ padding:8 }}>
        {CORRELATIONS.map(c => {
          const coeff = c.coefficient
          const color = coeff > 0 ? '#22c55e' : '#ef4444'
          return (
            <div key={c.pair} style={{ display:'flex', alignItems:'center', gap:5, marginBottom:6 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:9, color:'#8a9ab0' }}>{c.pair}</div>
                <div style={{ fontSize:8, color:'#5a6373' }}>{c.description}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                <div style={{ width:40, height:3, background:'#131821', borderRadius:1, overflow:'hidden' }}>
                  <div style={{ width:`${Math.abs(coeff)*100}%`, height:'100%', background:color, borderRadius:1 }} />
                </div>
                <span style={{ fontSize:10, fontWeight:700, color, width:28, textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{coeff.toFixed(2)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </PanelShell>
  )
}

function DXMPanel() {
  return (
    <PanelShell title="DXM SENTIMENT">
      <div style={{ padding:8 }}>
        {SENTIMENT_DATA.map(d => (
          <div key={d.pair} style={{ marginBottom:6 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
              <span style={{ fontSize:9, color:'#e2e8f0' }}>{d.pair}</span>
              <span style={{ fontSize:9 }}>
                <span style={{ color:'#22c55e' }}>{d.longPct}%L</span>{' '}
                <span style={{ color:'#ef4444' }}>{d.shortPct}%S</span>
              </span>
            </div>
            <div style={{ height:6, background:'#131821', borderRadius:1, overflow:'hidden', position:'relative' }}>
              <div style={{ width:`${d.longPct}%`, height:'100%', background:'#22c55e' }} />
              <div style={{ position:'absolute', top:0, left:'50%', width:1, height:'100%', background:'#2a3444' }} />
            </div>
          </div>
        ))}
        <div style={{ borderTop:'0.5px solid #1e2530', paddingTop:5, marginTop:2 }}>
          <KVRow label="Tracked" value="48,293" />
          <KVRow label="Source" value="IG · OANDA · Myfxbook" valueClass="text-term-text3" />
        </div>
      </div>
    </PanelShell>
  )
}

function PropIndicatorsPanel() {
  return (
    <PanelShell title="PROP. INDICATORS">
      <div style={{ padding:8 }}>
        {PROP_INDICATORS.map(ind => (
          <div key={ind.name} style={{ display:'flex', alignItems:'center', gap:5, marginBottom:5 }}>
            <span style={{ fontSize:9, color:'#8a9ab0', flex:1 }}>{ind.name}</span>
            <BarMeter value={ind.value} max={ind.max} color={ind.color} height={4} className="w-12" />
            <span style={{ fontSize:9, fontWeight:700, fontVariantNumeric:'tabular-nums', color:ind.color, width:18, textAlign:'right' }}>{ind.value}</span>
          </div>
        ))}
      </div>
    </PanelShell>
  )
}

function BiasPanel() {
  return (
    <PanelShell title="BIAS DIRECTIONNELS">
      <div style={{ padding:8, display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
        {PAIR_BIASES.map(b => {
          const col = b.direction==='Bullish' ? '#22c55e' : b.direction==='Bearish' ? '#ef4444' : '#f0b429'
          return (
            <div key={b.pair} style={{ background:'#131821', border:'0.5px solid #1e2530', borderRadius:2, padding:5 }}>
              <div style={{ fontSize:10, color:'#e2e8f0', fontWeight:700, marginBottom:1 }}>{b.pair}</div>
              <BiasChip direction={b.direction} />
              <div style={{ fontSize:8, color:'#5a6373', marginTop:1 }}>{b.confidence}% conf.</div>
              <div style={{ height:2, borderRadius:1, marginTop:3, background:col, width:`${b.confidence}%` }} />
            </div>
          )
        })}
      </div>
    </PanelShell>
  )
}

export function RightSidebar() {
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflowY:'auto' }}>
      <MacroRadarPanel />
      <div style={{ borderTop:'1px solid #1e2530' }}><BankResearchPanel /></div>
      <div style={{ borderTop:'1px solid #1e2530' }}><CorrelationsPanel /></div>
      <div style={{ borderTop:'1px solid #1e2530' }}><DXMPanel /></div>
      <div style={{ borderTop:'1px solid #1e2530' }}><PropIndicatorsPanel /></div>
      <div style={{ borderTop:'1px solid #1e2530' }}><BiasPanel /></div>
    </div>
  )
}
