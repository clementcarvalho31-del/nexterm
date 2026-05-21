'use client'
import { useState, useRef, useEffect, useMemo } from 'react'
import { loadBillingUser } from '@/lib/billing/client-storage'
import { trialDaysLeft } from '@/lib/billing/session-payload'
import { billingService } from '@/src/features/billing/services/BillingService'

type Lang = 'fr' | 'en'

const T = {
  fr: {
    account: 'Mon compte', settings: 'Paramètres', logout: 'Déconnexion',
    language: 'Langue', profile: 'Profil', subscription: 'Abonnement',
    trial: 'Essai gratuit', daysLeft: 'jours restants', upgrade: 'Passer Pro',
    name: 'Nom', email: 'Email', userId: 'ID Utilisateur',
    plan: 'Forfait', status: 'Statut', active: 'Actif',
    free: 'Gratuit', pro: 'Pro', premium: 'Premium',
    trialBadge: "Essai en cours",
  },
  en: {
    account: 'My account', settings: 'Settings', logout: 'Sign out',
    language: 'Language', profile: 'Profile', subscription: 'Subscription',
    trial: 'Free trial', daysLeft: 'days left', upgrade: 'Upgrade to Pro',
    name: 'Name', email: 'Email', userId: 'User ID',
    plan: 'Plan', status: 'Status', active: 'Active',
    free: 'Free', pro: 'Pro', premium: 'Premium',
    trialBadge: 'Trial active',
  }
}

interface AccountMenuProps {
  lang: Lang
  onLangChange: (l: Lang) => void
}

export function AccountMenu({ lang, onLangChange }: AccountMenuProps) {
  const [open, setOpen] = useState(false)
  const [section, setSection] = useState<'main'|'profile'|'subscription'|'language'>('main')
  const [billingBusy, setBillingBusy] = useState(false)
  const [billingError, setBillingError] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const t = T[lang]

  const billing = useMemo(() => loadBillingUser(), [open])

  const user = useMemo(() => {
    const name = billing?.name ?? billing?.email?.split('@')[0] ?? 'Trader'
    const plan = billing?.plan ?? 'free'
    return {
      name,
      email: billing?.email ?? '—',
      id: billing?.userId ?? '—',
      plan: plan as 'trial'|'free'|'pro'|'premium'|'team',
      trialDays: trialDaysLeft(billing?.trialEndsAt) || (plan === 'trial' ? 3 : 0),
      avatar: name.charAt(0).toUpperCase(),
      stripeCustomerId: billing?.stripeCustomerId,
      status: billing?.status,
    }
  }, [billing])

  const startCheckout = async (plan: 'pro' | 'team' = 'pro') => {
    if (!billing?.email || billing.email === '—') {
      setBillingError(lang === 'fr' ? 'Inscris-toi d’abord via /signup' : 'Sign up first at /signup')
      return
    }
    setBillingBusy(true)
    setBillingError(null)
    const { url, error } = await billingService.createCheckout({
      email: billing.email,
      name: billing.name,
      userId: billing.userId,
      plan,
    })
    setBillingBusy(false)
    if (error || !url) { setBillingError(error ?? 'Checkout failed'); return }
    window.location.href = url
  }

  const openPortal = async () => {
    if (!billing?.email) return
    setBillingBusy(true)
    setBillingError(null)
    const { url, error } = await billingService.openCustomerPortal(
      billing.email,
      billing.stripeCustomerId,
    )
    setBillingBusy(false)
    if (error || !url) { setBillingError(error ?? 'Portal failed'); return }
    window.location.href = url
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setSection('main')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const planColor = user.plan === 'trial' ? '#f0b429' : user.plan === 'pro' || user.plan === 'team' ? '#22c55e' : user.plan === 'premium' ? '#a78bfa' : '#64748b'
  const planLabel = user.plan === 'trial' ? t.trialBadge : user.plan === 'pro' ? t.pro : user.plan === 'team' ? 'Team' : user.plan === 'premium' ? t.premium : t.free
  const statusLabel = user.status === 'TRIALING' ? t.trialBadge : user.status === 'ACTIVE' ? t.active : (user.status ?? '—')

  return (
    <div ref={ref} style={{ position:'relative' }}>
      {/* Trigger button */}
      <button
        onClick={() => { setOpen(o=>!o); setSection('main') }}
        style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 12px', borderRadius:8, background: open ? 'rgba(240,180,41,.1)' : 'rgba(255,255,255,.06)', border:`1px solid ${open?'rgba(240,180,41,.35)':'rgba(255,255,255,.1)'}`, cursor:'pointer', transition:'all 150ms', fontFamily:'inherit' }}>
        {/* Avatar */}
        <div style={{ width:24, height:24, borderRadius:'50%', background:'linear-gradient(135deg,#f0b429,#d4780a)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#000', flexShrink:0 }}>{user.avatar}</div>
        <span style={{ fontSize:12, fontWeight:600, color:'#c8d6e5' }}>{t.account}</span>
        {/* Trial badge */}
        <span style={{ fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:3, background:planColor+'22', color:planColor, border:`0.5px solid ${planColor}55`, letterSpacing:'0.3px' }}>{planLabel}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition:'transform 150ms', flexShrink:0 }}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0, width:300, borderRadius:12, background:'#0d1117', border:'1px solid rgba(255,255,255,.1)', boxShadow:'0 20px 60px rgba(0,0,0,.6)', overflow:'hidden', zIndex:1000, animation:'t-fade-in 0.15s ease-out' }}>

          {/* Main menu */}
          {section === 'main' && (
            <>
              {/* User header */}
              <div style={{ padding:'16px 16px 12px', borderBottom:'0.5px solid rgba(255,255,255,.07)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,#f0b429,#d4780a)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:800, color:'#000', flexShrink:0 }}>{user.avatar}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#f0f4f8', letterSpacing:'-0.2px' }}>{user.name}</div>
                    <div style={{ fontSize:11, color:'#5a7080', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</div>
                  </div>
                  <div style={{ fontSize:9, padding:'2px 7px', borderRadius:4, background:planColor+'22', color:planColor, border:`0.5px solid ${planColor}55`, fontWeight:700, letterSpacing:'0.3px', flexShrink:0 }}>{planLabel}</div>
                </div>

                {/* Trial countdown */}
                {user.plan === 'trial' && (
                  <div style={{ marginTop:10, padding:'8px 10px', borderRadius:7, background:'rgba(240,180,41,.06)', border:'0.5px solid rgba(240,180,41,.2)' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
                      <span style={{ fontSize:10, color:'#f0b429', fontWeight:600 }}>⏳ {t.trial}</span>
                      <span style={{ fontSize:11, fontWeight:800, color:'#f0b429' }}>{user.trialDays} {t.daysLeft}</span>
                    </div>
                    <div style={{ height:4, borderRadius:2, background:'rgba(255,255,255,.06)' }}>
                      <div style={{ height:'100%', borderRadius:2, background:'linear-gradient(90deg,#f0b429,#d4780a)', width:`${(user.trialDays/3)*100}%`, transition:'width 0.3s' }}/>
                    </div>
                  </div>
                )}
              </div>

              {/* Menu items */}
              <div style={{ padding:'8px 0' }}>
                {[
                  { icon:'👤', label: lang==='fr'?'Profil':'Profile', sub: lang==='fr'?'Nom, email, ID':'Name, email, ID', action: ()=>setSection('profile') },
                  { icon:'💳', label: lang==='fr'?'Abonnement':'Subscription', sub: lang==='fr'?`Forfait ${planLabel}`:`Plan ${planLabel}`, action: ()=>setSection('subscription') },
                  { icon:'🌐', label: lang==='fr'?'Langue':'Language', sub: lang==='fr'?'Français':'English', action: ()=>setSection('language') },
                ].map(item => (
                  <button key={item.label} onClick={item.action} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'9px 16px', background:'transparent', border:'none', cursor:'pointer', transition:'background 100ms', textAlign:'left', fontFamily:'inherit' }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.04)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <span style={{ fontSize:15, width:20, textAlign:'center', flexShrink:0 }}>{item.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:'#c8d6e5' }}>{item.label}</div>
                      <div style={{ fontSize:10, color:'#4a5e72' }}>{item.sub}</div>
                    </div>
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M2 1.5L5.5 4L2 6.5" stroke="#3d5060" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </button>
                ))}
              </div>

              {/* Upgrade CTA */}
              {(user.plan === 'free' || user.plan === 'trial') && (
                <div style={{ padding:'0 12px 12px' }}>
                  <button
                    type="button"
                    disabled={billingBusy}
                    onClick={() => startCheckout('pro')}
                    style={{ width:'100%', padding:'9px 14px', borderRadius:7, background:'linear-gradient(135deg,#f0b429,#d4780a)', border:'none', color:'#000', fontSize:12, fontWeight:700, cursor: billingBusy ? 'wait' : 'pointer', opacity: billingBusy ? 0.7 : 1 }}
                  >
                    ⚡ {billingBusy ? '…' : t.upgrade}
                  </button>
                </div>
              )}

              {/* Sign out */}
              <div style={{ borderTop:'0.5px solid rgba(255,255,255,.06)', padding:'8px 0 4px' }}>
                <button style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'8px 16px', background:'transparent', border:'none', cursor:'pointer', color:'#ef4444', fontSize:12, fontWeight:500, fontFamily:'inherit', transition:'background 100ms' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,.05)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <span style={{ fontSize:14 }}>↩</span> {t.logout}
                </button>
              </div>
            </>
          )}

          {/* Profile section */}
          {section === 'profile' && (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 16px', borderBottom:'0.5px solid rgba(255,255,255,.07)' }}>
                <button onClick={()=>setSection('main')} style={{ background:'transparent', border:'none', color:'#5a7080', cursor:'pointer', fontSize:16, padding:0, lineHeight:1 }}>←</button>
                <span style={{ fontSize:12, fontWeight:700, color:'#c8d6e5' }}>{t.profile}</span>
              </div>
              <div style={{ padding:16, display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  { label: t.name, value: user.name },
                  { label: t.email, value: user.email },
                  { label: t.userId, value: user.id },
                ].map(f => (
                  <div key={f.label} style={{ padding:'10px 12px', borderRadius:7, background:'rgba(255,255,255,.03)', border:'0.5px solid rgba(255,255,255,.07)' }}>
                    <div style={{ fontSize:9, color:'#3d5060', letterSpacing:'0.4px', textTransform:'uppercase', marginBottom:4 }}>{f.label}</div>
                    <div style={{ fontSize:12, color:'#c8d6e5', fontWeight:500 }}>{f.value}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Subscription section */}
          {section === 'subscription' && (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 16px', borderBottom:'0.5px solid rgba(255,255,255,.07)' }}>
                <button onClick={()=>setSection('main')} style={{ background:'transparent', border:'none', color:'#5a7080', cursor:'pointer', fontSize:16, padding:0, lineHeight:1 }}>←</button>
                <span style={{ fontSize:12, fontWeight:700, color:'#c8d6e5' }}>{t.subscription}</span>
              </div>
              <div style={{ padding:16 }}>
                {/* Current plan */}
                <div style={{ padding:'12px 14px', borderRadius:8, background:`${planColor}11`, border:`1px solid ${planColor}33`, marginBottom:12 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:11, color:'#8a9db5' }}>{t.plan}</span>
                    <span style={{ fontSize:10, fontWeight:700, color:planColor, padding:'1px 6px', borderRadius:3, background:planColor+'22' }}>{planLabel}</span>
                  </div>
                  <div style={{ fontSize:16, fontWeight:700, color:'#f0f4f8' }}>{planLabel}</div>
                  <div style={{ fontSize:11, color:'#5a7080', marginTop:2 }}>{t.status}: <span style={{ color:'#22c55e' }}>{statusLabel}</span></div>
                  {user.plan === 'trial' && (
                    <div style={{ marginTop:8, fontSize:11, color:'#f0b429' }}>⏳ {user.trialDays} {t.daysLeft}</div>
                  )}
                </div>

                {/* Plans comparison */}
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {[
                    { name:'Pro', price:'$49/mo', features:['Full terminal','AI Copilot','All data feeds'], color:'#22c55e', highlight: user.plan!=='premium' },
                    { name:'Premium', price:'$149/mo', features:['Everything in Pro','5 seats','Admin dashboard'], color:'#a78bfa', highlight: false },
                  ].map(p => (
                    <div key={p.name} style={{ padding:'10px 12px', borderRadius:7, background: p.highlight?'rgba(34,197,94,.05)':'rgba(255,255,255,.02)', border:`0.5px solid ${p.highlight?'rgba(34,197,94,.2)':'rgba(255,255,255,.06)'}` }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ fontSize:12, fontWeight:700, color:'#c8d6e5' }}>{p.name}</span>
                        <span style={{ fontSize:12, fontWeight:700, color:p.color }}>{p.price}</span>
                      </div>
                      {p.features.map(f => <div key={f} style={{ fontSize:10, color:'#5a7080' }}>✓ {f}</div>)}
                    </div>
                  ))}
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:12 }}>
                  {(user.plan === 'free' || user.plan === 'trial') && (
                    <button
                      type="button"
                      disabled={billingBusy}
                      onClick={() => startCheckout('pro')}
                      style={{ width:'100%', padding:'9px 14px', borderRadius:7, background:'linear-gradient(135deg,#f0b429,#d4780a)', border:'none', color:'#000', fontSize:12, fontWeight:700, cursor: billingBusy ? 'wait' : 'pointer' }}
                    >
                      ⚡ {billingBusy ? '…' : t.upgrade}
                    </button>
                  )}
                  {billing?.stripeCustomerId && (
                    <button
                      type="button"
                      disabled={billingBusy}
                      onClick={openPortal}
                      style={{ width:'100%', padding:'9px 14px', borderRadius:7, background:'transparent', border:'0.5px solid rgba(255,255,255,.15)', color:'#c8d6e5', fontSize:12, fontWeight:600, cursor: billingBusy ? 'wait' : 'pointer' }}
                    >
                      {lang === 'fr' ? 'Gérer l’abonnement' : 'Manage subscription'}
                    </button>
                  )}
                  {billingError && (
                    <p style={{ fontSize: 10, color: '#ef4444', margin: 0 }}>{billingError}</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Language section */}
          {section === 'language' && (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 16px', borderBottom:'0.5px solid rgba(255,255,255,.07)' }}>
                <button onClick={()=>setSection('main')} style={{ background:'transparent', border:'none', color:'#5a7080', cursor:'pointer', fontSize:16, padding:0, lineHeight:1 }}>←</button>
                <span style={{ fontSize:12, fontWeight:700, color:'#c8d6e5' }}>{t.language}</span>
              </div>
              <div style={{ padding:12, display:'flex', flexDirection:'column', gap:6 }}>
                {([
                  { code:'fr', label:'Français', flag:'🇫🇷' },
                  { code:'en', label:'English', flag:'🇬🇧' },
                ] as {code:Lang;label:string;flag:string}[]).map(l => (
                  <button key={l.code} onClick={() => { onLangChange(l.code); setSection('main') }} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:7, background: lang===l.code?'rgba(240,180,41,.08)':'rgba(255,255,255,.02)', border:`0.5px solid ${lang===l.code?'rgba(240,180,41,.3)':'rgba(255,255,255,.06)'}`, cursor:'pointer', transition:'all 120ms', fontFamily:'inherit' }}>
                    <span style={{ fontSize:18 }}>{l.flag}</span>
                    <span style={{ fontSize:12, fontWeight:600, color: lang===l.code?'#f0b429':'#c8d6e5' }}>{l.label}</span>
                    {lang===l.code && <span style={{ marginLeft:'auto', fontSize:11, color:'#f0b429' }}>✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
