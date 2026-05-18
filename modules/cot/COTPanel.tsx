'use client'
import { PanelShell, BarMeter } from '@/components/ui'
import { COT_DATA, HEDGE_FUND_FLOWS, SENTIMENT_DATA } from '@/lib/data'
import { formatNet, cn } from '@/lib/utils'

function COTRow({ item }: { item: typeof COT_DATA[0] }) {
  const isUp = item.direction === 'up'
  const color = isUp ? '#22c55e' : '#ef4444'
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-[10px] text-[#e2e8f0] w-16 flex-shrink-0">{item.pair}</span>
      <BarMeter value={Math.abs(item.net)} max={item.max} color={color} height={5} />
      <span className={cn('text-[9px] tabular w-10 text-right flex-shrink-0', isUp ? 'text-up' : 'text-dn')}>
        {formatNet(item.net)}
      </span>
      <span className={cn('text-[9px] w-3 flex-shrink-0', isUp ? 'text-up' : 'text-dn')}>
        {isUp ? '▲' : '▼'}
      </span>
    </div>
  )
}

function SentRow({ item }: { item: typeof SENTIMENT_DATA[0] }) {
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-[10px] text-[#e2e8f0] w-16 flex-shrink-0">{item.pair}</span>
      <div className="flex-1 h-1.5 bg-term-bg4 rounded-sm overflow-hidden relative">
        <div className="h-full bg-term-red rounded-l-sm transition-all duration-500" style={{ width: `${item.shortPct}%` }} />
        <div className="absolute top-0 left-1/2 w-px h-full bg-term-border2" />
      </div>
      <span className="text-[9px] w-20 text-right flex-shrink-0">
        <span className="text-up">{item.longPct}%L</span>{' '}
        <span className="text-dn">{item.shortPct}%S</span>
      </span>
    </div>
  )
}

export function COTPanel() {
  return (
    <div className="h-full flex flex-col gap-2 overflow-y-auto p-2">
      <PanelShell title="COT — COMMITMENTS OF TRADERS (CFTC WEEKLY)" action="FULL REPORT">
        <div className="p-2 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[9px] text-term-text3 tracking-widest mb-2">NET SPECULATIVE POSITIONING</p>
            {COT_DATA.map(d => <COTRow key={d.pair} item={d} />)}
          </div>
          <div>
            <p className="text-[9px] text-term-text3 tracking-widest mb-2">RETAIL SENTIMENT (DXM)</p>
            {SENTIMENT_DATA.map(d => <SentRow key={d.pair} item={d} />)}
          </div>
        </div>
      </PanelShell>

      <PanelShell title="HEDGE FUND FLOWS — ESTIMATED POSITIONING">
        <div className="p-2 space-y-1">
          {HEDGE_FUND_FLOWS.map(h => (
            <div key={h.name} className="flex items-center gap-3 py-1.5 border-b border-term-border">
              <div className="flex-1">
                <p className="text-[9px] text-term-gold">{h.name}</p>
                <p className="text-[10px] text-[#e2e8f0]">
                  {h.pair} ·{' '}
                  <span className={h.direction === 'Long' ? 'text-up' : 'text-dn'}>{h.direction}</span>
                  {' · '}{h.size}
                </p>
              </div>
              <div className="w-20">
                <p className="text-[8px] text-term-text3 mb-0.5">Confidence</p>
                <div className="h-1 bg-term-bg4 rounded-sm overflow-hidden">
                  <div
                    className="h-full rounded-sm transition-all"
                    style={{ width: `${h.confidence}%`, background: h.confidence > 70 ? '#22c55e' : '#f0b429' }}
                  />
                </div>
              </div>
              <span className="text-[9px] text-term-text3 w-6">{h.confidence}%</span>
            </div>
          ))}
        </div>
      </PanelShell>
    </div>
  )
}
