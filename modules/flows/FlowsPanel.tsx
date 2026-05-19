'use client'
import { PanelShell } from '@/components/ui'
import { INSTITUTIONAL_FLOWS, OPTIONS_FLOW, DARK_POOL_PRINTS } from '@/lib/data'

export function FlowsPanel() {
  return (
    <div style={{overflow:'auto',height:'100%',padding:8,display:'flex',flexDirection:'column',gap:6}}>
      <PanelShell title="INSTITUTIONAL FLOW TRACKER (EST.)">
        <div style={{padding:8}}>
          {INSTITUTIONAL_FLOWS.map(f=>{
            const isUp = ('direction' in f) ? (f as any).direction === 'buy' || (f as any).direction === 'up' : true
            const desc = 'description' in f ? (f as any).description : (f as any).type ?? ''
            return (
              <div key={f.pair + desc} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 0',borderBottom:'0.5px solid #131821'}}>
                <span style={{fontSize:10,color:'#e2e8f0',width:56,fontWeight:700,flexShrink:0}}>{f.pair}</span>
                <span style={{fontSize:9,color:'#8a9ab0',flex:1}}>{desc}</span>
                <span style={{fontSize:10,fontWeight:700,color:isUp?'#22c55e':'#ef4444'}}>{f.size}</span>
                <div style={{width:8,height:8,borderRadius:'50%',background:isUp?'#22c55e':'#ef4444',flexShrink:0}}/>
              </div>
            )
          })}
        </div>
      </PanelShell>
      <PanelShell title="OPTIONS FLOW — NOTABLE STRIKES">
        <div style={{padding:8}}>
          {OPTIONS_FLOW.map(f=>{
            const strike = 'instrument' in f ? (f as any).instrument : (f as any).strike ?? ''
            const oi     = 'openInterest' in f ? (f as any).openInterest : (f as any).openInt ?? ''
            const isBull = f.bias === 'Bullish'
            return (
              <div key={strike} style={{display:'flex',alignItems:'center',gap:6,padding:'4px 0',borderBottom:'0.5px solid #131821'}}>
                <span style={{fontSize:10,color:'#e2e8f0',flex:1}}>{strike}</span>
                <span style={{fontSize:9,color:'#5a6373'}}>{f.expiry}</span>
                <span style={{fontSize:8,color:'#5a6373'}}>{oi}</span>
                <span style={{fontSize:9,fontWeight:700,color:isBull?'#22c55e':'#ef4444'}}>{f.bias}</span>
              </div>
            )
          })}
        </div>
      </PanelShell>
      <PanelShell title="DARK POOL PRINTS (SIMULATED)">
        <div style={{padding:8}}>
          {DARK_POOL_PRINTS.map(p=>{
            const signal = 'type' in p ? (p as any).type : (p as any).signal ?? ''
            const isAccum = signal.includes('Acc')
            return (
              <div key={p.pair} style={{display:'flex',alignItems:'center',gap:6,padding:'4px 0',borderBottom:'0.5px solid #131821'}}>
                <span style={{fontSize:10,color:'#e2e8f0',width:52,fontWeight:700,flexShrink:0}}>{p.pair}</span>
                <span style={{fontSize:9,color:'#f0b429',fontVariantNumeric:'tabular-nums'}}>{p.price}</span>
                <span style={{fontSize:9,color:'#8a9ab0',flex:1}}>{p.size}</span>
                <span style={{fontSize:9,fontWeight:700,color:isAccum?'#22c55e':'#ef4444'}}>{signal}</span>
              </div>
            )
          })}
          <p style={{fontSize:8,color:'#3d4a5a',marginTop:6}}>Simulated — real: Bloomberg MPSM / ICE</p>
        </div>
      </PanelShell>
    </div>
  )
}
