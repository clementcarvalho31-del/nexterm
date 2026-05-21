import type { Variants, Transition } from 'framer-motion'

// ─── Transitions ──────────────────────────────────────────────────────────────
export const transitions = {
  fast:    { duration: 0.08, ease: [0.4, 0, 0.2, 1] } satisfies Transition,
  base:    { duration: 0.15, ease: [0.4, 0, 0.2, 1] } satisfies Transition,
  slow:    { duration: 0.25, ease: [0.4, 0, 0.2, 1] } satisfies Transition,
  spring:  { type: 'spring', stiffness: 400, damping: 28 } satisfies Transition,
  springFast: { type: 'spring', stiffness: 600, damping: 35 } satisfies Transition,
} as const

// ─── Panel enter/exit variants ────────────────────────────────────────────────
export const panelVariants = {
  hidden:  { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0, transition: transitions.base },
  exit:    { opacity: 0, y: -4, transition: transitions.fast },
} satisfies Variants

// ─── Slide in from right (drawer) ─────────────────────────────────────────────
export const slideInRight: Variants = {
  hidden:  { x: '100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } },
  exit:    { x: '100%', opacity: 0, transition: { duration: 0.16 } },
}

// ─── Scale in (modals, popovers) ──────────────────────────────────────────────
export const scaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.94, y: -10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: transitions.springFast },
  exit:    { opacity: 0, scale: 0.96, y: -4, transition: transitions.fast },
}

// ─── Fade ─────────────────────────────────────────────────────────────────────
export const fadeVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: transitions.base },
  exit:    { opacity: 0, transition: transitions.fast },
}

// ─── Price tick flash ─────────────────────────────────────────────────────────
export const priceFlashUp: Variants = {
  normal:  { color: 'var(--t-text-primary)', backgroundColor: 'transparent' },
  flash:   { color: 'var(--t-market-up)',    backgroundColor: 'var(--t-market-up-muted)' },
}

export const priceFlashDown: Variants = {
  normal:  { color: 'var(--t-text-primary)', backgroundColor: 'transparent' },
  flash:   { color: 'var(--t-market-down)',   backgroundColor: 'var(--t-market-down-muted)' },
}

// ─── CSS keyframe definitions (injected as global styles) ─────────────────────
export const KEYFRAME_CSS = `
@keyframes t-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.35; }
}

@keyframes t-scroll-x {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}

@keyframes t-blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

@keyframes t-spin {
  to { transform: rotate(360deg); }
}

@keyframes t-tick-up {
  0%   { background-color: transparent; }
  20%  { background-color: var(--t-market-up-muted); }
  100% { background-color: transparent; }
}

@keyframes t-tick-down {
  0%   { background-color: transparent; }
  20%  { background-color: var(--t-market-down-muted); }
  100% { background-color: transparent; }
}

@keyframes t-shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}

@keyframes t-slide-in-right {
  from { transform: translateX(12px); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
`

// ─── Utility: animate price change ───────────────────────────────────────────
export type PriceDirection = 'up' | 'down' | 'none'

export function getPriceDirection(prev: number, next: number): PriceDirection {
  if (next > prev) return 'up'
  if (next < prev) return 'down'
  return 'none'
}
