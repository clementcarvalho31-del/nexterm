// ─── Theme engine ─────────────────────────────────────────────────────────────
export { ThemeProvider, useTheme, useToken } from './themes/ThemeProvider'
export { ThemeSwitcher }                     from './themes/ThemeSwitcher'
export type { ThemeId, ThemeTokens }         from './themes/themes'
export { THEMES, DEFAULT_THEME, isDarkTheme } from './themes/themes'

// ─── Design tokens ────────────────────────────────────────────────────────────
export { T } from './tokens/tokens'

// ─── UI Primitives ────────────────────────────────────────────────────────────
export {
  Panel, PanelHeader, PanelShell, Divider,
  TerminalButton, Badge, ImpactBadge, MarketValue,
  BarMeter, KVRow, ScrollArea, StatusDot,
  SectionLabel, TickerWrap,
} from './components/primitives'

// ─── Animations ───────────────────────────────────────────────────────────────
export {
  transitions, panelVariants, slideInRight, scaleIn, fadeVariants,
  priceFlashUp, priceFlashDown, getPriceDirection,
} from './animations/animations'
export type { PriceDirection } from './animations/animations'

// ─── Hooks ────────────────────────────────────────────────────────────────────
export { useThemeTokens, useMarketStyle, useButtonStyle } from './hooks/useThemeTokens'
