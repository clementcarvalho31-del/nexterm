'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { useTerminalStore } from '@/store/terminal'
import { DashboardPanel }    from '@/modules/chart/DashboardPanel'
import { COTPanel }          from '@/modules/cot/COTPanel'
import { CalendarPanel }     from '@/modules/calendar/CalendarPanel'
import { NewsPlayPanel }     from '@/modules/newsplay/NewsPlayPanel'
import { SeasonalityPanel }  from '@/modules/seasonality/SeasonalityPanel'
import { WorldbookPanel }    from '@/modules/worldbook/WorldbookPanel'
import { LiquidityPanel }    from '@/modules/liquidity/LiquidityPanel'
import type { TabId } from '@/types'

const PANELS: Record<TabId, React.ComponentType> = {
  dashboard:   DashboardPanel,
  cot:         COTPanel,
  calendar:    CalendarPanel,
  newsplay:    NewsPlayPanel,
  seasonality: SeasonalityPanel,
  worldbook:   WorldbookPanel,
  liquidity:   LiquidityPanel,
}

export function Workspace() {
  const activeTab = useTerminalStore(s => s.activeTab)
  const Panel = PANELS[activeTab]

  return (
    <div className="flex-1 overflow-hidden relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="h-full"
        >
          <Panel />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
