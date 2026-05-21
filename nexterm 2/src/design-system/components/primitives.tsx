'use client'
import { forwardRef, type ReactNode, type HTMLAttributes, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import type { NewsImpact } from '@/src/types'

// ─── Panel ────────────────────────────────────────────────────────────────────
interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean
}

export const Panel = forwardRef<HTMLDivElement, PanelProps>(function Panel(
  { children, className, glass, ...props }, ref
) {
  return (
    <div
      ref={ref}
      className={cn('flex flex-col overflow-hidden h-full', className)}
      style={{
        background:   glass ? 'var(--t-surface-glass)' : 'var(--t-surface-panel)',
        border:       '0.5px solid var(--t-border-default)',
        backdropFilter: glass ? 'blur(12px) saturate(180%)' : undefined,
        WebkitBackdropFilter: glass ? 'blur(12px) saturate(180%)' : undefined,
      }}
      {...props}
    >
      {children}
    </div>
  )
})

// ─── Panel Header ─────────────────────────────────────────────────────────────
interface PanelHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title:    string
  action?:  ReactNode
  subtitle?: string
}

export function PanelHeader({ title, action, subtitle, className, ...props }: PanelHeaderProps) {
  return (
    <div
      className={cn('flex items-center justify-between flex-shrink-0', className)}
      style={{
        background:   'var(--t-surface-elevated)',
        borderBottom: '0.5px solid var(--t-border-default)',
        padding:      '4px 8px',
        height:       26,
      }}
      {...props}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          fontSize:      'var(--t-size-xs)',
          color:         'var(--t-text-muted)',
          letterSpacing: '0.8px',
          textTransform: 'uppercase',
          fontFamily:    'var(--t-font-mono)',
          fontWeight:    600,
        }}>
          {title}
        </span>
        {subtitle && (
          <span style={{ fontSize: 'var(--t-size-2xs)', color: 'var(--t-text-disabled)' }}>
            {subtitle}
          </span>
        )}
      </div>
      {action && (
        <span style={{ fontSize: 'var(--t-size-xs)', color: 'var(--t-text-muted)', cursor: 'pointer' }}>
          {action}
        </span>
      )}
    </div>
  )
}

// ─── Panel Shell (combined panel + header) ────────────────────────────────────
interface PanelShellProps {
  title:    string
  action?:  ReactNode
  children: ReactNode
  className?: string
  bodyClass?: string
  glass?: boolean
}

export function PanelShell({ title, action, children, className, bodyClass, glass }: PanelShellProps) {
  return (
    <Panel className={className} glass={glass}>
      <PanelHeader title={title} action={action} />
      <div className={cn('flex-1 overflow-y-auto', bodyClass)}>
        {children}
      </div>
    </Panel>
  )
}

// ─── Surface divider ──────────────────────────────────────────────────────────
export function Divider({ vertical, style, ...props }: { vertical?: boolean } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        ...(vertical
          ? { width: '0.5px', height: '100%', background: 'var(--t-border-default)', flexShrink: 0 }
          : { width: '100%', height: '0.5px', background: 'var(--t-border-default)', flexShrink: 0 }),
        ...style,
      }}
      {...props}
    />
  )
}

// ─── Terminal Button ──────────────────────────────────────────────────────────
interface TerminalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'active' | 'ghost' | 'accent' | 'danger'
  size?:    'xs' | 'sm' | 'md'
}

const BTN_SIZES = {
  xs: { fontSize: 'var(--t-size-2xs)', padding: '1px 5px' },
  sm: { fontSize: 'var(--t-size-xs)',  padding: '2px 8px'  },
  md: { fontSize: 'var(--t-size-sm)',  padding: '4px 10px' },
}

const BTN_VARIANTS = {
  default: {
    background: 'transparent',
    border:     '0.5px solid transparent',
    color:      'var(--t-text-muted)',
    hoverColor: 'var(--t-text-secondary)',
  },
  active: {
    background: 'var(--t-accent-muted)',
    border:     '0.5px solid var(--t-border-strong)',
    color:      'var(--t-accent-primary)',
    hoverColor: 'var(--t-accent-primary)',
  },
  ghost: {
    background: 'var(--t-surface-hover)',
    border:     '0.5px solid var(--t-border-default)',
    color:      'var(--t-text-secondary)',
    hoverColor: 'var(--t-text-primary)',
  },
  accent: {
    background: 'var(--t-accent-primary)',
    border:     '0.5px solid var(--t-accent-primary)',
    color:      'var(--t-text-inverse)',
    hoverColor: 'var(--t-text-inverse)',
  },
  danger: {
    background: 'var(--t-status-danger-muted)',
    border:     '0.5px solid var(--t-status-danger)',
    color:      'var(--t-status-danger)',
    hoverColor: 'var(--t-status-danger)',
  },
}

export const TerminalButton = forwardRef<HTMLButtonElement, TerminalButtonProps>(
  function TerminalButton({ variant = 'default', size = 'sm', children, style, className, ...props }, ref) {
    const v = BTN_VARIANTS[variant]
    const s = BTN_SIZES[size]

    return (
      <button
        ref={ref}
        className={cn('cursor-pointer transition-all duration-75', className)}
        style={{
          fontFamily:   'var(--t-font-mono)',
          borderRadius: 'var(--t-radius-sm)',
          whiteSpace:   'nowrap',
          flexShrink:   0,
          outline:      'none',
          lineHeight:   1,
          ...v,
          ...s,
          ...style,
        }}
        onMouseEnter={e => {
          if (!props.disabled) {
            e.currentTarget.style.color = v.hoverColor
            if (variant === 'default') e.currentTarget.style.borderColor = 'var(--t-border-default)'
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = v.color
          if (variant === 'default') e.currentTarget.style.borderColor = 'transparent'
        }}
        {...props}
      >
        {children}
      </button>
    )
  }
)

// ─── Badge / Tag ──────────────────────────────────────────────────────────────
interface BadgeProps {
  label:    string
  color?:   string
  bg?:      string
  size?:    'xs' | 'sm'
}

export function Badge({ label, color, bg, size = 'xs' }: BadgeProps) {
  return (
    <span style={{
      fontSize:     size === 'xs' ? 'var(--t-size-2xs)' : 'var(--t-size-xs)',
      fontFamily:   'var(--t-font-mono)',
      fontWeight:   700,
      letterSpacing:'0.3px',
      padding:      size === 'xs' ? '1px 4px' : '2px 6px',
      borderRadius: 'var(--t-radius-sm)',
      color:        color ?? 'var(--t-text-primary)',
      background:   bg    ?? 'var(--t-surface-hover)',
      whiteSpace:   'nowrap' as const,
      flexShrink:   0,
    }}>
      {label}
    </span>
  )
}

// ─── Impact Badge (HIGH/MED/LOW) ──────────────────────────────────────────────
const IMPACT_STYLES = {
  high: { color: 'var(--t-impact-high)', bg: 'var(--t-impact-high-bg)' },
  med:  { color: 'var(--t-impact-med)',  bg: 'var(--t-impact-med-bg)'  },
  low:  { color: 'var(--t-impact-low)',  bg: 'var(--t-impact-low-bg)'  },
}

export function ImpactBadge({ impact }: { impact: NewsImpact }) {
  const s = IMPACT_STYLES[impact]
  return <Badge label={impact.toUpperCase()} color={s.color} bg={s.bg} />
}

// ─── Market color text ────────────────────────────────────────────────────────
export function MarketValue({ value, prefix = '', suffix = '', className, decimals = 2 }: {
  value:    number
  prefix?:  string
  suffix?:  string
  decimals?: number
  className?: string
}) {
  const isUp = value >= 0
  return (
    <span
      className={cn('tabular', className)}
      style={{
        color:      isUp ? 'var(--t-market-up)' : 'var(--t-market-down)',
        fontFamily: 'var(--t-font-mono)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {prefix}{isUp ? '+' : ''}{value.toFixed(decimals)}{suffix}
    </span>
  )
}

// ─── Bar meter ────────────────────────────────────────────────────────────────
interface BarMeterProps {
  value:     number
  max?:      number
  color?:    string
  height?:   number
  className?: string
}

export function BarMeter({ value, max = 100, color, height = 4, className }: BarMeterProps) {
  const pct = Math.min((Math.abs(value) / max) * 100, 100)
  return (
    <div
      className={cn('flex-1 rounded-sm overflow-hidden', className)}
      style={{ height, background: 'var(--t-surface-hover)', minWidth: 0 }}
    >
      <div
        style={{
          width:      `${pct}%`,
          height:     '100%',
          background: color ?? 'var(--t-accent-primary)',
          borderRadius: 'var(--t-radius-sm)',
          transition: 'width 0.4s var(--t-motion-ease)',
        }}
      />
    </div>
  )
}

// ─── KV Row ───────────────────────────────────────────────────────────────────
export function KVRow({ label, value, valueColor, className }: {
  label:      string
  value:      string
  valueColor?: string
  className?:  string
}) {
  return (
    <div className={cn('flex items-center justify-between py-0.5', className)}>
      <span style={{ fontSize: 'var(--t-size-xs)', color: 'var(--t-text-muted)', fontFamily: 'var(--t-font-mono)' }}>
        {label}
      </span>
      <span style={{ fontSize: 'var(--t-size-xs)', fontFamily: 'var(--t-font-mono)', fontVariantNumeric: 'tabular-nums', color: valueColor ?? 'var(--t-text-secondary)' }}>
        {value}
      </span>
    </div>
  )
}

// ─── Scrollable container ─────────────────────────────────────────────────────
export function ScrollArea({ children, className, style, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('overflow-y-auto', className)}
      style={{
        scrollbarWidth:  'thin',
        scrollbarColor:  'var(--t-border-strong) transparent',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

// ─── Status dot ───────────────────────────────────────────────────────────────
export function StatusDot({ status }: { status: 'live' | 'connecting' | 'offline' }) {
  const color = {
    live:       'var(--t-status-live)',
    connecting: 'var(--t-status-warning)',
    offline:    'var(--t-status-danger)',
  }[status]

  return (
    <span
      style={{
        width:        6,
        height:       6,
        borderRadius: '50%',
        background:   color,
        display:      'inline-block',
        flexShrink:   0,
        animation:    status === 'live' ? 't-pulse 2s ease-in-out infinite' : undefined,
      }}
    />
  )
}

// ─── Section label ────────────────────────────────────────────────────────────
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{
      fontSize:      'var(--t-size-2xs)',
      color:         'var(--t-text-muted)',
      letterSpacing: '1px',
      textTransform: 'uppercase',
      fontFamily:    'var(--t-font-mono)',
      marginBottom:  4,
      marginTop:     8,
      paddingLeft:   2,
    }}>
      {children}
    </div>
  )
}

// ─── Ticker (scrolling news bar) ─────────────────────────────────────────────
export function TickerWrap({ children }: { children: ReactNode }) {
  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
      <div style={{ display: 'flex', animation: 't-scroll-x 55s linear infinite', whiteSpace: 'nowrap' }}>
        {children}
        {children}
      </div>
    </div>
  )
}
