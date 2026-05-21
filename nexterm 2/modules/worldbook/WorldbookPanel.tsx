'use client'
import { PanelShell, KVRow } from '@/components/ui'
import { WORLDBOOK } from '@/lib/data'
import { cn } from '@/lib/utils'
import type { CentralBankBias } from '@/types'

function BiasTag({ bias }: { bias: CentralBankBias }) {
  const cls = bias === 'Hawkish' ? 'text-up' : bias === 'Dovish' ? 'text-dn' : 'text-gold'
  return <span className={cn('text-[9px] font-bold', cls)}>{bias}</span>
}

export function WorldbookPanel() {
  return (
    <div className="h-full overflow-y-auto p-2">
      <PanelShell title="WORLDBOOK — MACRO DASHBOARD BY COUNTRY">
        <div className="p-2 grid grid-cols-3 gap-2">
          {WORLDBOOK.map(c => (
            <div key={c.country} className="bg-term-bg4 border border-term-border rounded-sm p-2">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[11px]">{c.flag}</span>
                <span className="text-[9px] text-term-text3">{c.country}</span>
              </div>
              <p className="text-[10px] text-[#e2e8f0] font-bold mb-2">{c.name}</p>
              <KVRow label="GDP" value={c.gdp} valueClass="text-up" />
              <KVRow label="CPI" value={c.cpi} valueClass="text-dn" />
              <KVRow label="Rate" value={c.rate} />
              <div className="flex justify-between items-center pt-0.5 mt-0.5 border-t border-term-border">
                <span className="text-[8px] text-term-text3">CB Bias</span>
                <BiasTag bias={c.bias} />
              </div>
            </div>
          ))}
        </div>
      </PanelShell>
    </div>
  )
}
