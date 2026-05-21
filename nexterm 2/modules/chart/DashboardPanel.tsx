'use client'
import { PanelShell, BarMeter, BiasChip } from '@/components/ui'
import { COT_DATA, SENTIMENT_DATA, CALENDAR_EVENTS, PAIR_BIASES, SEASONALITY_EUR, MONTHS } from '@/lib/data'
import { formatNet, seasonClass, cn } from '@/lib/utils'

function MiniCOT() {
  return (
    <PanelShell title="COT POSITIONING">
      <div className="p-2 space-y-1.5">
        {COT_DATA.slice(0, 4).map(d => {
          const isUp = d.direction === 'up'
          return (
            <div key={d.pair} className="flex items-center gap-2">
              <span className="text-[10px] text-[#e2e8f0] w-14 flex-shrink-0">{d.pair}</span>
              <BarMeter value={Math.abs(d.net)} max={d.max} color={isUp ? '#22c55e' : '#ef4444'} height={5} />
              <span className={cn('text-[9px] tabular w-10 text-right flex-shrink-0', isUp ? 'text-up' : 'text-dn')}>
                {formatNet(d.net)}
              </span>
            </div>
          )
        })}
      </div>
    </PanelShell>
  )
}

function MiniSentiment() {
  return (
    <PanelShell title="RETAIL SENTIMENT (DXM)">
      <div className="p-2 space-y-2">
        {SENTIMENT_DATA.slice(0, 4).map(d => (
          <div key={d.pair}>
            <div className="flex justify-between mb-0.5">
              <span className="text-[9px] text-[#e2e8f0]">{d.pair}</span>
              <span className="text-[9px]">
                <span className="text-up">{d.longPct}%L</span>{' '}
                <span className="text-dn">{d.shortPct}%S</span>
              </span>
            </div>
            <div className="h-1.5 bg-term-bg4 rounded-sm overflow-hidden relative">
              <div className="h-full bg-term-red rounded-l-sm" style={{ width: `${d.shortPct}%` }} />
              <div className="absolute top-0 left-1/2 w-px h-full bg-term-border2" />
            </div>
          </div>
        ))}
      </div>
    </PanelShell>
  )
}

function MiniCalendar() {
  const highImpact = CALENDAR_EVENTS.filter(e => e.impact === 'high').slice(0, 4)
  return (
    <PanelShell title="HIGH IMPACT — TODAY">
      <div className="p-2 space-y-1">
        {highImpact.map(e => (
          <div key={e.id} className="flex items-center gap-2 py-1 border-b border-term-border">
            <span className="text-[9px] text-term-text3 tabular w-9 flex-shrink-0">{e.time}</span>
            <span className="text-[10px] flex-shrink-0">{e.flag}</span>
            <span className="text-[9px] text-[#e2e8f0] flex-1">{e.event}</span>
            <span className="text-[9px] text-term-gold tabular">{e.forecast}</span>
          </div>
        ))}
      </div>
    </PanelShell>
  )
}

function MiniSessionPrep() {
  const biases = [['EUR/USD','Bullish'], ['GBP/USD','Bullish'], ['USD/JPY','Bearish'], ['USD/CHF','Bearish']]
  const levels = [['EUR/USD R1','1.0870'], ['EUR/USD S1','1.0810'], ['NFP Pivot','1.0843']]
  return (
    <PanelShell title="SESSION PREPARATION">
      <div className="p-2">
        <p className="text-[9px] text-term-text3 tracking-widest mb-1.5">LONDON SESSION BIAS</p>
        <div className="flex flex-wrap gap-1 mb-3">
          {biases.map(([pair, bias]) => (
            <div key={pair} className="bg-term-bg4 border border-term-border px-1.5 py-0.5 rounded-sm">
              <span className="text-[9px] text-term-text2">{pair}</span>{' '}
              <span className={cn('text-[9px] font-bold', bias === 'Bullish' ? 'text-up' : 'text-dn')}>{bias}</span>
            </div>
          ))}
        </div>
        <p className="text-[9px] text-term-text3 tracking-widest mb-1.5">KEY LEVELS TODAY</p>
        {levels.map(([k, v]) => (
          <div key={k} className="flex justify-between mb-0.5">
            <span className="text-[9px] text-term-text2">{k}</span>
            <span className="text-[9px] text-term-gold tabular">{v}</span>
          </div>
        ))}
      </div>
    </PanelShell>
  )
}

function MiniSeasonality() {
  return (
    <PanelShell title="EUR/USD SEASONALITY — MAY">
      <div className="p-2">
        <div className="grid grid-cols-12 gap-0.5 mb-0.5">
          {MONTHS.map(m => <div key={m} className="text-[7px] text-term-text3 text-center">{m}</div>)}
        </div>
        <div className="grid grid-cols-12 gap-0.5">
          {SEASONALITY_EUR.map((v, i) => (
            <div key={i} className={cn('h-3 rounded-sm flex items-center justify-center text-[6px]', seasonClass(v), i === 4 ? 'ring-1 ring-term-gold' : '')}
              style={{ color: 'rgba(255,255,255,0.5)' }}>
              {v > 0 ? '+' : ''}{(v * 100).toFixed(0)}
            </div>
          ))}
        </div>
      </div>
    </PanelShell>
  )
}

function MiniLiquidity() {
  const items = [
    { label: 'NY Open',        val: 82, color: '#22c55e' },
    { label: 'London Close',   val: 67, color: '#22c55e' },
    { label: 'Asia Flow',      val: 31, color: '#ef4444' },
    { label: 'Risk Appetite',  val: 44, color: '#f0b429' },
  ]
  return (
    <PanelShell title="LIQUIDITY & FLUX">
      <div className="p-2 space-y-1.5">
        {items.map(r => (
          <div key={r.label} className="flex items-center gap-2">
            <span className="text-[9px] text-term-text2 w-24 flex-shrink-0">{r.label}</span>
            <BarMeter value={r.val} color={r.color} height={4} />
            <span className="text-[9px] text-term-text3 w-6 text-right">{r.val}%</span>
          </div>
        ))}
      </div>
    </PanelShell>
  )
}

export function DashboardPanel() {
  return (
    <div className="h-full overflow-y-auto p-2 grid grid-cols-2 gap-2 content-start auto-rows-min">
      <MiniCOT />
      <MiniSentiment />
      <MiniCalendar />
      <MiniSessionPrep />
      <MiniSeasonality />
      <MiniLiquidity />
    </div>
  )
}
