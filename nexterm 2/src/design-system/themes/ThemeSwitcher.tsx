'use client'
import { memo, useState } from 'react'
import { useTheme } from './ThemeProvider'
import { THEMES } from './themes'
import { AnimatePresence, motion } from 'framer-motion'

type ThemeId = keyof typeof THEMES

const THEME_DISPLAY: Record<ThemeId, { label: string; accent: string; bg: string }> = {
  'dark-terminal': { label: 'Terminal',  accent: '#f0b429', bg: '#0a0c0f' },
  'dark-pro':      { label: 'Dark Pro',  accent: '#2962ff', bg: '#131722' },
  'dark-midnight': { label: 'Midnight',  accent: '#00d4aa', bg: '#070a12' },
  'light-clean':   { label: 'Light',     accent: '#2962ff', bg: '#f0f2f5' },
}

interface ThemeSwitcherProps {
  compact?: boolean
}

export const ThemeSwitcher = memo(function ThemeSwitcher({ compact = true }: ThemeSwitcherProps) {
  const { themeId, setTheme } = useTheme()
  const [open, setOpen] = useState(false)

  if (compact) {
    return (
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(v => !v)}
          title="Switch theme"
          style={{
            display:      'flex', alignItems: 'center', gap: 4,
            background:   'transparent', border: '0.5px solid var(--t-border-default)',
            borderRadius: 'var(--t-radius-sm)', cursor: 'pointer',
            padding:      '2px 6px', fontFamily: 'var(--t-font-mono)',
            color:        'var(--t-text-muted)', fontSize: 'var(--t-size-xs)',
            transition:   'all var(--t-motion-fast)',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--t-border-strong)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--t-border-default)'}
        >
          <ThemeDot color={THEME_DISPLAY[themeId as ThemeId]?.accent ?? '#f0b429'} />
          <span style={{ fontSize: 8 }}>THEME</span>
        </button>

        <AnimatePresence>
          {open && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 98 }}
                onClick={() => setOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.1 }}
                style={{
                  position: 'absolute', top: '110%', right: 0, zIndex: 99,
                  background:   'var(--t-surface-overlay)',
                  border:       '0.5px solid var(--t-border-strong)',
                  borderRadius: 'var(--t-radius-md)',
                  boxShadow:    'var(--t-shadow-lg)',
                  padding:      4, minWidth: 140,
                  backdropFilter: 'blur(12px)',
                }}
              >
                {(Object.keys(THEME_DISPLAY) as ThemeId[]).map(id => {
                  const d = THEME_DISPLAY[id]
                  const isActive = id === themeId
                  return (
                    <button
                      key={id}
                      onClick={() => { setTheme(id); setOpen(false) }}
                      style={{
                        display:      'flex', alignItems: 'center', gap: 8,
                        width:        '100%', padding: '6px 10px',
                        background:   isActive ? 'var(--t-surface-hover)' : 'transparent',
                        border:       'none', cursor: 'pointer',
                        borderRadius: 'var(--t-radius-sm)',
                        fontFamily:   'var(--t-font-mono)',
                        transition:   'background var(--t-motion-fast)',
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--t-surface-hover)' }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                    >
                      {/* Mini preview */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 22, height: 14, background: d.bg, borderRadius: 2, border: `0.5px solid var(--t-border-default)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: d.accent }} />
                        </div>
                      </div>
                      <span style={{ fontSize: 'var(--t-size-xs)', color: isActive ? 'var(--t-accent-primary)' : 'var(--t-text-secondary)' }}>
                        {d.label}
                      </span>
                      {isActive && (
                        <span style={{ marginLeft: 'auto', fontSize: 8, color: 'var(--t-accent-primary)' }}>✓</span>
                      )}
                    </button>
                  )
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Full inline switcher (for settings panel)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
      {(Object.keys(THEME_DISPLAY) as ThemeId[]).map(id => {
        const d = THEME_DISPLAY[id]
        const isActive = id === themeId
        return (
          <button
            key={id}
            onClick={() => setTheme(id)}
            style={{
              display:      'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding:      10, cursor: 'pointer',
              background:   isActive ? 'var(--t-accent-muted)' : 'var(--t-surface-hover)',
              border:       `0.5px solid ${isActive ? 'var(--t-border-focus)' : 'var(--t-border-default)'}`,
              borderRadius: 'var(--t-radius-md)',
              fontFamily:   'var(--t-font-mono)',
              transition:   'all var(--t-motion-base)',
            }}
          >
            {/* Theme miniature */}
            <div style={{ width: 56, height: 36, background: d.bg, borderRadius: 2, border: `0.5px solid var(--t-border-strong)`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 4, left: 4, width: 24, height: 4, background: d.accent, borderRadius: 1, opacity: 0.8 }} />
              <div style={{ position: 'absolute', top: 12, left: 4, right: 4, height: 16, display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                {[6, 10, 7, 14, 9, 12, 8].map((h, i) => (
                  <div key={i} style={{ flex: 1, height: h, background: i % 2 === 0 ? d.accent : '#7a1a1a', borderRadius: 1, opacity: 0.7 }} />
                ))}
              </div>
            </div>
            <span style={{ fontSize: 'var(--t-size-xs)', color: isActive ? 'var(--t-accent-primary)' : 'var(--t-text-secondary)' }}>
              {d.label}
            </span>
          </button>
        )
      })}
    </div>
  )
})

function ThemeDot({ color }: { color: string }) {
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
}
