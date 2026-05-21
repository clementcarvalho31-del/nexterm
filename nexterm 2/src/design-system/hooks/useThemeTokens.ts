'use client'
import { useCallback } from 'react'
import { useTheme } from '../themes/ThemeProvider'
import { T } from '../tokens/tokens'

/**
 * Returns the `T` token helpers and current theme info.
 * Use `T.surface.panel` etc. to get `var(--t-surface-panel)` references.
 * These are CSS variable strings — they resolve at paint time.
 *
 * @example
 * const { T, isDark, themeId } = useThemeTokens()
 * <div style={{ background: T.surface.panel }}>
 */
export function useThemeTokens() {
  const { isDark, themeId } = useTheme()
  return { T, isDark, themeId }
}

/**
 * Returns a style builder function for market-colored values.
 * @example
 * const getMarketStyle = useMarketStyle()
 * const style = getMarketStyle(0.42) // { color: var(--t-market-up) }
 */
export function useMarketStyle() {
  return useCallback((value: number): React.CSSProperties => ({
    color:              value >= 0 ? T.market.up : T.market.down,
    fontVariantNumeric: 'tabular-nums',
    fontFamily:         T.font.mono,
  }), [])
}

/**
 * Returns styled props for an interactive terminal button.
 * Handles hover/active states via CSS variables.
 */
export function useButtonStyle(active?: boolean): React.CSSProperties {
  return {
    fontFamily:   T.font.mono,
    fontSize:     T.size.xs,
    borderRadius: T.radius.sm,
    cursor:       'pointer',
    border:       `0.5px solid ${active ? T.border.strong : 'transparent'}`,
    background:   active ? T.accent.muted : 'transparent',
    color:        active ? T.accent.primary : T.text.muted,
    padding:      `${T.space[1]} ${T.space[3]}`,
    transition:   `all ${T.motion.fast}`,
    whiteSpace:   'nowrap' as const,
  }
}
