'use client'
import { PanelShell } from '@/components/ui'
import { SEASONALITY_EUR, SEASONALITY_GBP, SEASONALITY_JPY, MONTHS } from '@/lib/data'
import { seasonClass, cn } from '@/lib/utils'

function SeasonGrid({ data, currentMonth = 4, label }: { data: number[]; currentMonth?: number; label: string }) {
  return (
    <div className="mb-4">
      <p className="text-[9px] text-term-text3 tracking-widest uppercase mb-2">{label}</p>
      <div className="grid grid-cols-12 gap-0.5 mb-0.5">
        {MONTHS.map(m => (
          <div key={m} className="text-[7px] text-term-text3 text-center">{m}</div>
        ))}
      </div>
      <div className="grid grid-cols-12 gap-0.5">
        {data.map((v, i) => (
          <div
            key={i}
            className={cn(
              'h-4 rounded-sm flex items-center justify-center text-[7px] transition-all',
              seasonClass(v),
              i === currentMonth ? 'ring-1 ring-term-gold' : ''
            )}
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            {v > 0 ? '+' : ''}{(v * 100).toFixed(0)}
          </div>
        ))}
      </div>
    </div>
  )
}

export function SeasonalityPanel() {
  return (
    <div className="h-full overflow-y-auto p-2">
      <PanelShell title="SEASONALITY — 10Y AVERAGE RETURNS">
        <div className="p-3">
          <p className="text-[9px] text-term-text3 mb-3">
            May highlighted — EUR/USD historically +0.3% avg return. Strong bearish bias in Q3.
          </p>
          <SeasonGrid data={SEASONALITY_EUR} label="EUR/USD" />
          <SeasonGrid data={SEASONALITY_GBP} label="GBP/USD" />
          <SeasonGrid data={SEASONALITY_JPY} label="USD/JPY" />
        </div>
      </PanelShell>
    </div>
  )
}
