'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'email'|'password'>('email')

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    if (step === 'email') { setStep('password'); return }
    setLoading(true)
    setTimeout(() => { router.push('/terminal') }, 1500)
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 8,
    background: 'rgba(255,255,255,.05)', border: '0.5px solid rgba(255,255,255,.12)',
    color: '#f0f4f8', fontSize: 14, fontFamily: 'inherit', outline: 'none',
    transition: 'border-color 120ms', boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ minHeight:'100vh', background:'#080b10', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Inter',-apple-system,sans-serif", padding:16, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%', background:'rgba(240,180,41,.04)', filter:'blur(100px)', top:'50%', left:'50%', transform:'translate(-50%,-60%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:'rgba(55,138,221,.04)', filter:'blur(80px)', bottom:'10%', left:'20%', pointerEvents:'none' }} />

      <div style={{ width:'100%', maxWidth:400, position:'relative', zIndex:1 }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ width:40, height:40, background:'linear-gradient(135deg,#f0b429,#d4780a)', borderRadius:10, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, color:'#000', boxShadow:'0 4px 20px rgba(240,180,41,.3)', marginBottom:16 }}>N</div>
          <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.8px', color:'#f0f4f8', marginBottom:6 }}>Welcome back</h1>
          <p style={{ fontSize:14, color:'#5a7080' }}>Sign in to your Nexterm account</p>
        </div>

        <div style={{ background:'rgba(255,255,255,.04)', border:'0.5px solid rgba(255,255,255,.1)', borderRadius:14, padding:28, backdropFilter:'blur(20px)' }}>
          {step === 'email' && (
            <>
              {[
                { icon:'G', label:'Continue with Google',   bg:'#fff',    color:'#3c4043', border:'rgba(0,0,0,.12)' },
                { icon:'in',label:'Continue with LinkedIn', bg:'#0077b5', color:'#fff',    border:'#0077b5' },
              ].map(s => (
                <button key={s.label} onClick={() => router.push('/terminal')} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, width:'100%', padding:'11px 16px', borderRadius:8, background:s.bg, border:`0.5px solid ${s.border}`, color:s.color, fontSize:14, fontWeight:600, cursor:'pointer', marginBottom:10, transition:'all 120ms', fontFamily:'inherit' }}>
                  <span style={{ fontWeight:800, fontSize:15 }}>{s.icon}</span> {s.label}
                </button>
              ))}
              <div style={{ display:'flex', alignItems:'center', gap:10, margin:'16px 0' }}>
                <div style={{ flex:1, height:'0.5px', background:'rgba(255,255,255,.08)' }} />
                <span style={{ fontSize:12, color:'#3d5060' }}>or continue with email</span>
                <div style={{ flex:1, height:'0.5px', background:'rgba(255,255,255,.08)' }} />
              </div>
            </>
          )}

          <form onSubmit={handleContinue} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#8a9db5', marginBottom:6, letterSpacing:'0.2px' }}>Email address</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required autoFocus={step==='email'} style={inputStyle}
                onFocus={e=>e.currentTarget.style.borderColor='rgba(240,180,41,.5)'}
                onBlur={e=>e.currentTarget.style.borderColor='rgba(255,255,255,.12)'} />
            </div>

            {step === 'password' && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:'#8a9db5', letterSpacing:'0.2px' }}>Password</label>
                  <a href="#" style={{ fontSize:12, color:'#f0b429', textDecoration:'none' }}>Forgot password?</a>
                </div>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required autoFocus style={inputStyle}
                  onFocus={e=>e.currentTarget.style.borderColor='rgba(240,180,41,.5)'}
                  onBlur={e=>e.currentTarget.style.borderColor='rgba(255,255,255,.12)'} />
              </div>
            )}

            <button type="submit" disabled={loading} style={{ padding:'12px 20px', borderRadius:8, background:loading?'rgba(240,180,41,.6)':'linear-gradient(135deg,#f0b429,#d4780a)', border:'none', color:'#000', fontSize:14, fontWeight:700, cursor:loading?'wait':'pointer', transition:'all 150ms', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 2px 12px rgba(240,180,41,.25)' }}>
              {loading ? (
                <><span style={{ width:14, height:14, borderRadius:'50%', border:'2px solid rgba(0,0,0,.3)', borderTopColor:'#000', animation:'t-spin .7s linear infinite', display:'inline-block' }} />Signing in…</>
              ) : step === 'email' ? 'Continue →' : 'Sign in →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign:'center', marginTop:20, fontSize:13, color:'#3d5060' }}>
          Don't have an account?{' '}
          <Link href="/signup" style={{ color:'#f0b429', textDecoration:'none', fontWeight:600 }}>Start free trial</Link>
        </p>
      </div>
    </div>
  )
}
