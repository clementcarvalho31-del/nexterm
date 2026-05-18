'use client'
import { cn } from '@/lib/utils'
import type { NewsImpact, DirectionalBias, BankBias } from '@/types'

interface PanelShellProps {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClass?: string
}
export function PanelShell({ title, action, children, className, bodyClass }: PanelShellProps) {
  return (
    <div className={cn('flex flex-col overflow-hidden h-full', className)}>
      <div className="panel-header flex-shrink-0">
        <span className="panel-title">{title}</span>
        {action && <span className="text-[9px] text-term-text3 cursor-pointer hover:text-term-text2">{action}</span>}
      </div>
      <div className={cn('flex-1 overflow-y-auto', bodyClass)}>{children}</div>
    </div>
  )
}

export function ImpactBadge({ impact }: { impact: NewsImpact }) {
  return (
    <span className={cn('px-1 py-0.5 rounded-sm text-[8px] font-bold flex-shrink-0',
      impact === 'high' ? 'tag-high' : impact === 'med' ? 'tag-med' : 'tag-info')}>
      {impact.toUpperCase()}
    </span>
  )
}

export function TagBadge({ tag, cls }: { tag: string; cls?: string }) {
  return <span className={cn('px-1 py-0.5 rounded-sm text-[8px] font-bold', cls ?? 'tag-info')}>{tag}</span>
}

interface BarMeterProps { value: number; max?: number; color?: string; height?: number; className?: string }
export function BarMeter({ value, max = 100, color = '#22c55e', height = 5, className }: BarMeterProps) {
  const pct = Math.min((Math.abs(value) / max) * 100, 100)
  return (
    <div className={cn('bg-term-bg4 rounded-sm overflow-hidden flex-1', className)} style={{ height }}>
      <div className="h-full rounded-sm transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export function BiasChip({ direction }: { direction: DirectionalBias }) {
  const color = direction === 'Bullish' ? 'text-term-green' : direction === 'Bearish' ? 'text-term-red' : 'text-term-gold'
  return <span className={cn('text-[9px] font-bold', color)}>{direction}</span>
}

export function BankBiasChip({ direction }: { direction: BankBias }) {
  const cls = direction === 'BUY' ? 'text-term-green bg-[#0d2318]' : direction === 'SELL' ? 'text-term-red bg-[#1f0d0d]' : 'text-term-gold bg-[#1a1a0d]'
  return <span className={cn('px-1 py-0.5 rounded-sm text-[8px] font-bold', cls)}>{direction}</span>
}

export function KVRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <span className="text-[9px] text-term-text3">{label}</span>
      <span className={cn('text-[9px] tabular', valueClass)}>{value}</span>
    </div>
  )
}

export function SectionDivider({ label }: { label: string }) {
  return <div className="text-[9px] text-term-text3 tracking-widest uppercase mb-1 mt-3 first:mt-0">{label}</div>
}
