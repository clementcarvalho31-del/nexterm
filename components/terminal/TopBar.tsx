'use client'
import { useTerminalStore } from '@/store/terminal'
import { ThemeSwitcher } from '@/src/design-system/themes/ThemeSwitcher'
import type { TabId } from '@/src/types'

export function TopBar() {
  const utcTime        = useTerminalStore(s => s.utcTime)
  const status         = useTerminalStore(s => s.status)
  const setCommandOpen = useTerminalStore(s => s.setCommandOpen)
  const activeTab      = useTerminalStore(s => s.activeTab)
  const setActiveTab   = useTerminalStore(s => s.setActiveTab)

  const isLive = status === 'connected'
  const isConn = status === 'connecting'

  return (
    <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:48, padding:'0 16px', flexShrink:0, background:'var(--t-surface-elevated)', borderBottom:'0.5px solid var(--t-border-default)', gap:16 }}>

      {/* Logo — cliquable pour retourner à l'accueil */}
      <div style={{ display:'flex', alignItems:'center', gap:9, flexShrink:0 }}>
        <div style={{ width:28, height:28, background:'linear-gradient(135deg,var(--t-accent-primary) 0%,#d4780a 100%)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#000', fontFamily:'var(--t-font-sans)', boxShadow:'0 2px 8px rgba(240,180,41,.25)', flexShrink:0 }}>N</div>
        <span style={{ fontFamily:'var(--t-font-sans)', fontWeight:700, fontSize:15, letterSpacing:'-0.4px', color:'var(--t-text-heading)' }}>Nexterm</span>
      </div>

      {/* Nav — seulement Home + Calendar */}
      <nav style={{ display:'flex', alignItems:'center', gap:2, flex:1 }}>

        {/* Bouton Home */}
        <button
          onClick={() => { if (typeof window !== 'undefined') window.location.reload() }}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:5, fontSize:13, fontFamily:'var(--t-font-sans)', fontWeight:400, color:'var(--t-text-muted)', background:'transparent', border:'none', cursor:'pointer', transition:'all 120ms' }}
          title="Retour à l'accueil"
          onMouseEnter={e=>e.currentTarget.style.color='var(--t-text-secondary)'}
          onMouseLeave={e=>e.currentTarget.style.color='var(--t-text-muted)'}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M1 6.5L7 1.5L13 6.5V12.5H9V9H5V12.5H1V6.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
          Accueil
        </button>

        {/* Calendar */}
        <button
          onClick={() => setActiveTab('calendar')}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:5, fontSize:13, fontFamily:'var(--t-font-sans)', fontWeight:activeTab==='calendar'?600:400, color:activeTab==='calendar'?'var(--t-accent-primary)':'var(--t-text-muted)', background:activeTab==='calendar'?'rgba(240,180,41,.08)':'transparent', border:activeTab==='calendar'?'0.5px solid rgba(240,180,41,.2)':'0.5px solid transparent', cursor:'pointer', transition:'all 120ms' }}
          onMouseEnter={e=>{ if(activeTab!=='calendar') e.currentTarget.style.color='var(--t-text-secondary)' }}
          onMouseLeave={e=>{ if(activeTab!=='calendar') e.currentTarget.style.color='var(--t-text-muted)' }}>
          <span style={{ width:5, height:5, borderRadius:'50%', background:'#ef4444', display:'inline-block', animation:'t-pulse 2s ease-in-out infinite', boxShadow:'0 0 4px rgba(239,68,68,.6)' }} />
          Calendar
        </button>
      </nav>

      {/* Right */}
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 9px', borderRadius:5, background:'var(--t-surface-hover)', border:'0.5px solid var(--t-border-default)' }}>
          <span style={{ width:5, height:5, borderRadius:'50%', background:isLive?'var(--t-status-live)':isConn?'var(--t-status-warning)':'var(--t-status-danger)', display:'inline-block', animation:isLive?'t-pulse 2s ease-in-out infinite':'none', boxShadow:isLive?'0 0 5px var(--t-status-live)':'none' }} />
          <span style={{ fontSize:10, fontFamily:'var(--t-font-mono)', color:isLive?'var(--t-status-live)':'var(--t-text-muted)', letterSpacing:'0.4px' }}>{isLive?'LIVE':isConn?'SYNC':'OFF'}</span>
        </div>
        <span style={{ fontSize:11, fontFamily:'var(--t-font-mono)', color:'var(--t-text-muted)', letterSpacing:'0.5px', fontVariantNumeric:'tabular-nums' }}>{utcTime}</span>
        <button onClick={()=>setCommandOpen(true)} style={{ display:'flex', alignItems:'center', gap:7, padding:'5px 11px', borderRadius:5, background:'var(--t-surface-hover)', border:'0.5px solid var(--t-border-default)', color:'var(--t-text-muted)', fontSize:12, fontFamily:'var(--t-font-sans)', cursor:'pointer', transition:'all 120ms' }}
          onMouseEnter={e=>{ e.currentTarget.style.borderColor='var(--t-border-strong)'; e.currentTarget.style.color='var(--t-text-secondary)' }}
          onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--t-border-default)'; e.currentTarget.style.color='var(--t-text-muted)' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="5.5" cy="5.5" r="3.8" stroke="currentColor" strokeWidth="1.2"/><line x1="8.5" y1="8.5" x2="11" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          <span>Search</span>
          <kbd style={{ fontSize:9, padding:'1px 4px', background:'var(--t-surface-active)', borderRadius:3, color:'var(--t-text-disabled)', fontFamily:'var(--t-font-mono)' }}>⌘K</kbd>
        </button>
        <ThemeSwitcher compact />
        <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#667eea,#764ba2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', cursor:'pointer', border:'1.5px solid var(--t-border-default)', transition:'border-color 120ms', flexShrink:0 }}
          onMouseEnter={e=>e.currentTarget.style.borderColor='var(--t-border-focus)'}
          onMouseLeave={e=>e.currentTarget.style.borderColor='var(--t-border-default)'}>
          C
        </div>
      </div>
    </header>
  )
}


export function TopBar() {
  const utcTime        = useTerminalStore(s => s.utcTime)
  const status         = useTerminalStore(s => s.status)
  const setCommandOpen = useTerminalStore(s => s.setCommandOpen)
  const activeTab      = useTerminalStore(s => s.activeTab)
  const setActiveTab   = useTerminalStore(s => s.setActiveTab)

  const isLive = status === 'connected'
  const isConn = status === 'connecting'

  return (
    <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:48, padding:'0 16px', flexShrink:0, background:'var(--t-surface-elevated)', borderBottom:'0.5px solid var(--t-border-default)', gap:16 }}>

      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:9, flexShrink:0 }}>
        <div style={{ width:28, height:28, background:'linear-gradient(135deg,var(--t-accent-primary) 0%,#d4780a 100%)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#000', fontFamily:'var(--t-font-sans)', boxShadow:'0 2px 8px rgba(240,180,41,.25)', flexShrink:0 }}>N</div>
        <span style={{ fontFamily:'var(--t-font-sans)', fontWeight:700, fontSize:15, letterSpacing:'-0.4px', color:'var(--t-text-heading)' }}>Nexterm</span>
      </div>

      {/* Nav */}
      <nav style={{ display:'flex', alignItems:'center', gap:1, flex:1 }}>
        {NAV.map(item => {
          const isActive = item.tab ? activeTab === item.tab : false
          return (
            <button key={item.label}
              onClick={() => item.tab && setActiveTab(item.tab as TabId)}
              style={{ padding:'5px 12px', borderRadius:5, fontSize:13, fontFamily:'var(--t-font-sans)', fontWeight:isActive?600:400, color:isActive?'var(--t-text-heading)':'var(--t-text-muted)', background:isActive?'var(--t-surface-hover)':'transparent', border:'none', cursor:'pointer', transition:'all 120ms', letterSpacing:'-0.1px' }}
              onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.color='var(--t-text-secondary)' }}
              onMouseLeave={e=>{ if(!isActive) e.currentTarget.style.color='var(--t-text-muted)' }}>
              {item.label}
            </button>
          )
        })}

        {/* Calendar — bouton dédié avec pulse si high impact */}
        <button
          onClick={() => setActiveTab('calendar')}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:5, fontSize:13, fontFamily:'var(--t-font-sans)', fontWeight:activeTab==='calendar'?600:400, color:activeTab==='calendar'?'var(--t-accent-primary)':'var(--t-text-muted)', background:activeTab==='calendar'?'rgba(240,180,41,.08)':'transparent', border:activeTab==='calendar'?'0.5px solid rgba(240,180,41,.2)':'0.5px solid transparent', cursor:'pointer', transition:'all 120ms' }}
          onMouseEnter={e=>{ if(activeTab!=='calendar') e.currentTarget.style.color='var(--t-text-secondary)' }}
          onMouseLeave={e=>{ if(activeTab!=='calendar') e.currentTarget.style.color='var(--t-text-muted)' }}>
          <span style={{ width:5, height:5, borderRadius:'50%', background:'#ef4444', display:'inline-block', animation:'t-pulse 2s ease-in-out infinite', boxShadow:'0 0 4px rgba(239,68,68,.6)' }} />
          Calendar
        </button>

        <button
          onClick={() => setActiveTab('copilot')}
          style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:5, fontSize:13, fontFamily:'var(--t-font-sans)', fontWeight:activeTab==='copilot'?600:400, color:activeTab==='copilot'?'var(--t-accent-primary)':'var(--t-text-muted)', background:activeTab==='copilot'?'rgba(240,180,41,.08)':'transparent', border:activeTab==='copilot'?'0.5px solid rgba(240,180,41,.2)':'0.5px solid transparent', cursor:'pointer', transition:'all 120ms' }}
          onMouseEnter={e=>{ if(activeTab!=='copilot') e.currentTarget.style.color='var(--t-text-secondary)' }}
          onMouseLeave={e=>{ if(activeTab!=='copilot') e.currentTarget.style.color='var(--t-text-muted)' }}>
          AI Copilot
        </button>
      </nav>

      {/* Right */}
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 9px', borderRadius:5, background:'var(--t-surface-hover)', border:'0.5px solid var(--t-border-default)' }}>
          <span style={{ width:5, height:5, borderRadius:'50%', background:isLive?'var(--t-status-live)':isConn?'var(--t-status-warning)':'var(--t-status-danger)', display:'inline-block', animation:isLive?'t-pulse 2s ease-in-out infinite':'none', boxShadow:isLive?'0 0 5px var(--t-status-live)':'none' }} />
          <span style={{ fontSize:10, fontFamily:'var(--t-font-mono)', color:isLive?'var(--t-status-live)':'var(--t-text-muted)', letterSpacing:'0.4px' }}>{isLive?'LIVE':isConn?'SYNC':'OFF'}</span>
        </div>
        <span style={{ fontSize:11, fontFamily:'var(--t-font-mono)', color:'var(--t-text-muted)', letterSpacing:'0.5px', fontVariantNumeric:'tabular-nums' }}>{utcTime}</span>
        <button onClick={()=>setCommandOpen(true)} style={{ display:'flex', alignItems:'center', gap:7, padding:'5px 11px', borderRadius:5, background:'var(--t-surface-hover)', border:'0.5px solid var(--t-border-default)', color:'var(--t-text-muted)', fontSize:12, fontFamily:'var(--t-font-sans)', cursor:'pointer', transition:'all 120ms' }}
          onMouseEnter={e=>{ e.currentTarget.style.borderColor='var(--t-border-strong)'; e.currentTarget.style.color='var(--t-text-secondary)' }}
          onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--t-border-default)'; e.currentTarget.style.color='var(--t-text-muted)' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="5.5" cy="5.5" r="3.8" stroke="currentColor" strokeWidth="1.2"/><line x1="8.5" y1="8.5" x2="11" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          <span>Search</span>
          <kbd style={{ fontSize:9, padding:'1px 4px', background:'var(--t-surface-active)', borderRadius:3, color:'var(--t-text-disabled)', fontFamily:'var(--t-font-mono)' }}>⌘K</kbd>
        </button>
        <ThemeSwitcher compact />
        <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#667eea,#764ba2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', cursor:'pointer', border:'1.5px solid var(--t-border-default)', transition:'border-color 120ms', flexShrink:0 }}
          onMouseEnter={e=>e.currentTarget.style.borderColor='var(--t-border-focus)'}
          onMouseLeave={e=>e.currentTarget.style.borderColor='var(--t-border-default)'}>
          C
        </div>
      </div>
    </header>
  )
}
