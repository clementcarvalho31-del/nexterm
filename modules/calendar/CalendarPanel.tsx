'use client'
import { PanelShell, ImpactBadge } from '@/components/ui'
import { CALENDAR_EVENTS } from '@/lib/data'
import { cn } from '@/lib/utils'
import type { CalendarEvent } from '@/types'

function CalRow({ event }: { event: CalendarEvent }) {
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-term-border">
      <span className="text-[9px] text-term-text3 w-9 flex-shrink-0 tabular">{event.time}</span>
      <span className="text-[10px] w-4 flex-shrink-0">{event.flag}</span>
      <span className="text-[10px] text-[#e2e8f0] flex-1">{event.event}</span>
      <ImpactBadge impact={event.impact} />
      <span className="text-[9px] text-term-text3 w-10 text-right tabular flex-shrink-0" title="Previous">{event.previous}</span>
      <span className="text-[9px] text-term-gold w-10 text-right tabular flex-shrink-0" title="Forecast">{event.forecast}</span>
      <span className={cn(
        'text-[9px] w-10 text-right tabular flex-shrink-0 font-bold',
        event.actual ? 'text-term-gold' : 'text-term-text3'
      )} title="Actual">
        {event.actual || '—'}
      </span>
    </div>
  )
}

export function CalendarPanel() {
  return (
    <div className="h-full overflow-y-auto p-2">
      <PanelShell title="ECONOMIC CALENDAR — THIS WEEK" action={
        <div className="flex gap-1">
          <span className="px-1 py-0.5 rounded-sm text-[8px] font-bold tag-high">HIGH</span>
          <span className="px-1 py-0.5 rounded-sm text-[8px] font-bold tag-med">MED</span>
          <span className="px-1 py-0.5 rounded-sm text-[8px] font-bold tag-info">LOW</span>
        </div>
      }>
        <div className="p-2">
          <div className="flex items-center gap-2 pb-1 border-b border-term-border mb-1">
            <span className="text-[9px] text-term-text3 w-9">TIME</span>
            <span className="w-4" />
            <span className="text-[9px] text-term-text3 flex-1">EVENT</span>
            <span className="text-[9px] text-term-text3 w-8" />
            <span className="text-[9px] text-term-text3 w-10 text-right">PREV</span>
            <span className="text-[9px] text-term-text3 w-10 text-right">FORE</span>
            <span className="text-[9px] text-term-text3 w-10 text-right">ACT</span>
          </div>
          {CALENDAR_EVENTS.map(e => <CalRow key={e.id} event={e} />)}
        </div>
      </PanelShell>
    </div>
  )
}
