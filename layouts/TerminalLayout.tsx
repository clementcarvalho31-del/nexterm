'use client'
import { TopBar }        from '@/components/terminal/TopBar'
import { WatchlistBar }  from '@/components/terminal/WatchlistBar'
import { SessionBar }    from '@/components/terminal/SessionBar'
import { WorkspaceTabs } from '@/components/terminal/WorkspaceTabs'
import { NewsFeedPanel } from '@/modules/news/NewsFeedPanel'
import { RightSidebar }  from '@/modules/news/RightSidebar'
import { Workspace }     from '@/layouts/Workspace'
import { useMarketTick } from '@/hooks/useMarket'

export function TerminalLayout() {
  useMarketTick(900)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden',
      background: '#03050a', color: 'var(--text-1)',
      fontFamily: 'var(--font-sans)',
    }}>
      <TopBar />
      <WatchlistBar />
      <SessionBar />

      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* Left — News */}
        <div style={{
          width: 196, flexShrink: 0, overflow: 'hidden',
          borderRight: '1px solid rgba(255,255,255,.04)',
        }}>
          <NewsFeedPanel />
        </div>

        {/* Center */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <WorkspaceTabs />
          <Workspace />
        </div>

        {/* Right */}
        <div style={{
          width: 188, flexShrink: 0, overflow: 'hidden',
          borderLeft: '1px solid rgba(255,255,255,.04)',
        }}>
          <RightSidebar />
        </div>

      </div>
    </div>
  )
}
