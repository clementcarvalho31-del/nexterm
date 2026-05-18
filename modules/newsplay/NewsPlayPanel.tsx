'use client'
import { PanelShell } from '@/components/ui'
import { NEWS_SCENARIOS } from '@/lib/data'
import { cn } from '@/lib/utils'
import type { NewsScenarioCase } from '@/types'

function ScenarioCase({
  item, cls, labelColor
}: { item: NewsScenarioCase; cls: string; labelColor: string }) {
  return (
    <div className={cn('flex-1 p-1.5 rounded-sm', cls)}>
      <p className={cn('text-[8px] font-bold mb-0.5', labelColor)}>{item.label}</p>
      <p className="text-[8px] text-term-text3">{item.condition}</p>
      <p className="text-[8px] mt-1" style={{ color: labelColor.includes('green') ? '#22c55e' : labelColor.includes('red') ? '#ef4444' : '#f0b429' }}>
        {item.action}
      </p>
    </div>
  )
}

export function NewsPlayPanel() {
  return (
    <div className="h-full overflow-y-auto p-2">
      <PanelShell title="NEWS TRADING — SCENARIOS" action="ADD SCENARIO">
        <div className="p-2 space-y-3">
          {NEWS_SCENARIOS.map(s => (
            <div key={s.event} className="border-b border-term-border pb-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] text-[#e2e8f0] font-bold">{s.event}</span>
                <span className="text-[9px] text-term-text3 ml-auto">{s.date}</span>
              </div>
              <div className="flex gap-1.5">
                <ScenarioCase item={s.bull} cls="case-bull" labelColor="text-up" />
                <ScenarioCase item={s.bear} cls="case-bear" labelColor="text-dn" />
                <ScenarioCase item={s.base} cls="case-base" labelColor="text-gold" />
              </div>
            </div>
          ))}
        </div>
      </PanelShell>
    </div>
  )
}
