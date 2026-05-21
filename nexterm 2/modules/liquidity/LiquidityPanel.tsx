'use client'
import { PanelShell, BarMeter, SectionDivider } from '@/components/ui'
import { cn } from '@/lib/utils'

const SESSION_LIQ = [
  { label: 'NY Open (8:30AM EST)',     value: 82, color: '#22c55e' },
  { label: 'London Close (11AM EST)', value: 67, color: '#22c55e' },
  { label: 'Asian Session Flow',      value: 31, color: '#ef4444' },
  { label: 'EUR Open Liquidity',      value: 74, color: '#22c55e' },
]

const INST_FLOWS = [
  { label: 'USD net flow (today)',      value: 65, color: '#ef4444' },
  { label: 'EUR institutional buy',    value: 71, color: '#22c55e' },
  { label: 'Risk appetite index',      value: 44, color: '#f0b429' },
  { label: 'Cross-asset correlation',  value: 82, color: '#378add' },
]

const SMART_MONEY = [
  { label: 'Dealer accumulation',       status: 'Active',         color: '#22c55e' },
  { label: 'Stop hunt detected EUR/USD',status: '1.0820 zone',   color: '#ef4444' },
  { label: 'Imbalance H1',              status: '1.0855–1.0870', color: '#f0b429' },
  { label: 'Fair value gap D1',         status: '1.0780–1.0800', color: '#378add' },
  { label: 'Weekly high target',        status: '1.0905',        color: '#8a9ab0' },
]

function LiqRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-[9px] text-term-text2 flex-1">{label}</span>
      <BarMeter value={value} color={color} height={4} className="w-16" />
      <span className="text-[9px] text-term-text3 w-7 text-right">{value}%</span>
    </div>
  )
}

export function LiquidityPanel() {
  return (
    <div className="h-full overflow-y-auto p-2 grid grid-cols-2 gap-2 content-start">
      <PanelShell title="LIQUIDITY — REAL-TIME FLOWS">
        <div className="p-2">
          <SectionDivider label="Session Liquidity Index" />
          {SESSION_LIQ.map(r => <LiqRow key={r.label} {...r} />)}
          <SectionDivider label="Institutional Flow Tracker" />
          {INST_FLOWS.map(r => <LiqRow key={r.label} {...r} />)}
        </div>
      </PanelShell>

      <PanelShell title="SMART MONEY TRACKER">
        <div className="p-2 space-y-1">
          {SMART_MONEY.map(r => (
            <div key={r.label} className="flex justify-between items-center py-1.5 border-b border-term-border">
              <span className="text-[9px] text-term-text2">{r.label}</span>
              <span className="text-[9px] font-bold" style={{ color: r.color }}>{r.status}</span>
            </div>
          ))}
        </div>
      </PanelShell>
    </div>
  )
}
