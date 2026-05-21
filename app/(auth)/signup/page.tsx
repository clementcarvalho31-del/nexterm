'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const STEPS = ['Account', 'Profile', 'Plan']

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ email:'', password:'', name:'', plan:'pro' })
  const [loading, setLoading] = useState(false)

  const upd = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const next = (e: React.FormEvent) => {
    e.preventDefault()
    if (step < 2) { setStep(s=>s+1); return }
    setLoading(true)
    setTimeout(() => { router.push('/terminal') }, 1800)
  }

  const inputStyle: React.CSSProperties = {
    width:'100%', padding:'11px 14px', borderRadius:8,
    background:'rgba(255,255,255,.05)', border:'0.5px solid rgba(255,255,255,.12)',
    color:'#f0f4f8', fontSize:14, fontFamily:'inherit', outline:'none',
    transition:'border-color 120ms', boxSizing:'border-box',
  }

  return (
    <div style={{ minHeight:'100vh', background:'#080b10', display:'flex', fontFamily:"'Inter',-apple-system,sans-serif", overflow:'hidden' }}>
      {/* Left panel */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'40px 48px', background:'rgba(240,180,41,.03)', borderRight:'0.5px solid rgba(255,255,255,.06)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          <div style={{ width:28, height:28, background:'linear-gradient(135deg,#f0b429,#d4780a)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#000' }}>N</div>
          <span style={{ fontWeight:700, fontSize:15, color:'#f0f4f8', letterSpacing:'-0.3px' }}>Nexterm</span>
        </div>

        <div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 10px', borderRadius:100, background:'rgba(240,180,41,.1)', border:'0.5px solid rgba(240,180,41,.2)', marginBottom:24 }}>
            <span style={{ fontSize:11, color:'#f0b429', fontWeight:600 }}>3-DAY FREE TRIAL</span>
          </div>
          <h2 style={{ fontSize:32, fontWeight:800, color:'#f0f4f8', letterSpacing:'-1px', lineHeight:1.2, marginBottom:16 }}>
            The terminal serious<br />FX traders use.
          </h2>
          <p style={{ fontSize:14, color:'#5a7080', lineHeight:1.7, maxWidth:380, marginBottom:32 }}>
            Realtime macro data, AI-powered market analysis, institutional charts, and COT positioning — all in one workspace.
          </p>
          {[
            'Realtime WebSocket streaming',
            'AI Copilot with live market context',
            'COT, yields, DXM, sentiment data',
            'Multi-chart Bloomberg-style workspace',
          ].map(f=>(
            <div key={f} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <span style={{ width:18, height:18, borderRadius:'50%', background:'rgba(34,197,94,.15)', border:'0.5px solid rgba(34,197,94,.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#22c55e', flexShrink:0 }}>✓</span>
              <span style={{ fontSize:13, color:'#8a9db5' }}>{f}</span>
            </div>
          ))}
        </div>

        <div style={{ fontSize:12, color:'#3d5060' }}>
          No credit card required for trial.
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ width:480, display:'flex', alignItems:'center', justifyContent:'center', padding:40, flexShrink:0 }}>
        <div style={{ width:'100%', maxWidth:360 }}>
          {/* Step indicator */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:32 }}>
            {STEPS.map((s,i)=>(
              <div key={s} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, background:i<=step?'linear-gradient(135deg,#f0b429,#d4780a)':'rgba(255,255,255,.06)', color:i<=step?'#000':'#3d5060', border:`0.5px solid ${i<=step?'transparent':'rgba(255,255,255,.1)'}`, transition:'all 200ms' }}>{i<step?'✓':i+1}</div>
                <span style={{ fontSize:12, color:i===step?'#f0f4f8':i<step?'#5a7080':'#3d5060', fontWeight:i===step?600:400 }}>{s}</span>
                {i<2 && <div style={{ width:20, height:'0.5px', background:i<step?'rgba(240,180,41,.4)':'rgba(255,255,255,.08)' }} />}
              </div>
            ))}
          </div>

          <h1 style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.6px', color:'#f0f4f8', marginBottom:6 }}>
            {step===0?'Create your account':step===1?'Tell us about you':'Choose your plan'}
          </h1>
          <p style={{ fontSize:13, color:'#3d5060', marginBottom:24 }}>
            {step===0?'Start your 3-day free trial':step===1?'Personalize your experience':'All plans include a 3-day trial'}
          </p>

          <form onSubmit={next} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {step === 0 && <>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'#8a9db5', display:'block', marginBottom:6 }}>Email address</label>
                <input type="email" value={form.email} onChange={upd('email')} placeholder="you@example.com" required autoFocus style={inputStyle}
                  onFocus={e=>e.currentTarget.style.borderColor='rgba(240,180,41,.5)'} onBlur={e=>e.currentTarget.style.borderColor='rgba(255,255,255,.12)'}/>
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'#8a9db5', display:'block', marginBottom:6 }}>Password</label>
                <input type="password" value={form.password} onChange={upd('password')} placeholder="Min 8 characters" required style={inputStyle}
                  onFocus={e=>e.currentTarget.style.borderColor='rgba(240,180,41,.5)'} onBlur={e=>e.currentTarget.style.borderColor='rgba(255,255,255,.12)'}/>
              </div>
            </>}

            {step === 1 && <>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'#8a9db5', display:'block', marginBottom:6 }}>Full name</label>
                <input type="text" value={form.name} onChange={upd('name')} placeholder="Your name" required autoFocus style={inputStyle}
                  onFocus={e=>e.currentTarget.style.borderColor='rgba(240,180,41,.5)'} onBlur={e=>e.currentTarget.style.borderColor='rgba(255,255,255,.12)'}/>
              </div>
              <div style={{ padding:14, borderRadius:8, background:'rgba(240,180,41,.06)', border:'0.5px solid rgba(240,180,41,.2)' }}>
                <p style={{ fontSize:12, color:'#f0b429', marginBottom:4, fontWeight:600 }}>3-day free trial starts now</p>
                <p style={{ fontSize:12, color:'#7a8fa8' }}>Full access to all features. No credit card needed.</p>
              </div>
            </>}

            {step === 2 && <>
              {[
                { id:'pro', name:'Pro', price:'$49/mo', desc:'Full terminal access, AI Copilot, all data feeds', popular:true },
                { id:'team', name:'Team', price:'$149/mo', desc:'Up to 5 seats, shared workspaces, admin dashboard', popular:false },
              ].map(p=>(
                <label key={p.id} style={{ display:'block', padding:14, borderRadius:8, border:`0.5px solid ${form.plan===p.id?'rgba(240,180,41,.4)':'rgba(255,255,255,.1)'}`, background:form.plan===p.id?'rgba(240,180,41,.06)':'transparent', cursor:'pointer', transition:'all 120ms' }}>
                  <input type="radio" name="plan" value={p.id} checked={form.plan===p.id} onChange={upd('plan')} style={{ display:'none' }}/>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:14, fontWeight:700, color:'#f0f4f8' }}>{p.name}</span>
                      <span style={{ fontSize:10, fontWeight:700, color:'#22c55e', background:'rgba(34,197,94,.12)', border:'0.5px solid rgba(34,197,94,.25)', borderRadius:100, padding:'2px 7px', letterSpacing:'0.3px' }}>3 DAYS FREE</span>
                    </div>
                    <span style={{ fontSize:14, fontWeight:700, color:form.plan===p.id?'#f0b429':'#8a9db5' }}>{p.price}</span>
                  </div>
                  <p style={{ fontSize:12, color:'#5a7080', marginBottom:0 }}>{p.desc}</p>
                </label>
              ))}
              {/* Trial reminder */}
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', borderRadius:8, background:'rgba(34,197,94,.05)', border:'0.5px solid rgba(34,197,94,.15)' }}>
                <span style={{ fontSize:16 }}>🎁</span>
                <p style={{ fontSize:12, color:'#5a9070', margin:0 }}>Your <strong style={{ color:'#22c55e' }}>3-day free trial</strong> starts immediately — no credit card required.</p>
              </div>
            </>}

            <button type="submit" disabled={loading} style={{ padding:'12px 20px', borderRadius:8, background:loading?'rgba(240,180,41,.6)':'linear-gradient(135deg,#f0b429,#d4780a)', border:'none', color:'#000', fontSize:14, fontWeight:700, cursor:loading?'wait':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 2px 12px rgba(240,180,41,.25)', marginTop:4 }}>
              {loading?<><span style={{ width:14, height:14, borderRadius:'50%', border:'2px solid rgba(0,0,0,.3)', borderTopColor:'#000', animation:'t-spin .7s linear infinite', display:'inline-block' }}/> Setting up…</>:step<2?'Continue →':'Start free trial →'}
            </button>
          </form>

          <p style={{ textAlign:'center', marginTop:20, fontSize:13, color:'#3d5060' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color:'#f0b429', textDecoration:'none', fontWeight:600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
