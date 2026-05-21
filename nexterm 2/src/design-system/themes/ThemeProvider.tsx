'use client'
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { THEMES, DEFAULT_THEME, isDarkTheme, generateCSSVars, type ThemeId, type ThemeTokens } from './themes'

const STORAGE_KEY = 'nexterm_theme_v2'

interface ThemeContextValue {
  themeId:  ThemeId
  tokens:   ThemeTokens
  isDark:   boolean
  setTheme: (id: ThemeId) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  themeId: DEFAULT_THEME, tokens: THEMES[DEFAULT_THEME], isDark: true, setTheme: () => {},
})

const STATIC_VARS = `
  --t-font-sans:    'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --t-font-mono:    'IBM Plex Mono', 'Courier New', Consolas, monospace;
  --t-font-display: 'Inter', -apple-system, sans-serif;

  --t-size-2xs: 9px;  --t-size-xs: 10px; --t-size-sm: 11px;
  --t-size-base:12px; --t-size-md: 13px; --t-size-lg: 14px;
  --t-size-xl:  16px; --t-size-2xl:20px; --t-size-3xl:24px;

  --t-space-px:1px; --t-space-1:2px;  --t-space-2:4px;
  --t-space-3:6px;  --t-space-4:8px;  --t-space-5:10px;
  --t-space-6:12px; --t-space-8:16px;

  --t-radius-xs:2px; --t-radius-sm:4px; --t-radius-md:6px;
  --t-radius-lg:8px; --t-radius-xl:12px; --t-radius-full:9999px;

  --t-motion-fast:  80ms;
  --t-motion-base:  150ms;
  --t-motion-slow:  250ms;
  --t-motion-ease:  cubic-bezier(0.4,0,0.2,1);
  --t-motion-spring:cubic-bezier(0.34,1.56,0.64,1);
`

function applyTheme(id: ThemeId): void {
  if (typeof document === 'undefined') return
  const cssVars = generateCSSVars(THEMES[id])
  let style = document.getElementById('nexterm-theme') as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = 'nexterm-theme'
    document.head.appendChild(style)
  }
  style.textContent = `:root {\n${STATIC_VARS}\n${cssVars}\n}`
  document.documentElement.setAttribute('data-theme', id)
  document.documentElement.setAttribute('data-dark', isDarkTheme(id) ? 'true' : 'false')
}

export function ThemeProvider({ children, defaultTheme = DEFAULT_THEME }: { children: ReactNode; defaultTheme?: ThemeId }) {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    if (typeof window === 'undefined') return defaultTheme
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null
    return (stored && stored in THEMES) ? stored : defaultTheme
  })

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id)
    applyTheme(id)
    try { localStorage.setItem(STORAGE_KEY, id) } catch { /* noop */ }
  }, [])

  useEffect(() => { applyTheme(themeId) }, [themeId])

  return (
    <ThemeContext.Provider value={{ themeId, tokens: THEMES[themeId], isDark: isDarkTheme(themeId), setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() { return useContext(ThemeContext) }
export function useToken(v: string): string { return `var(${v})` }
