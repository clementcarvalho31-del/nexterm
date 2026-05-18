'use client'
import { useRealtimeMarket } from '@/hooks/useRealtimeMarket'
import { TopBar }            from '@/components/terminal/TopBar'
import { WatchlistBar }      from '@/components/terminal/WatchlistBar'
import { SessionBar }        from '@/components/terminal/SessionBar'
import { WorkspaceTabs }     from '@/components/terminal/WorkspaceTabs'
import { CommandPalette }    from '@/components/command/CommandPalette'
import { Workspace }         from '@/layouts/Workspace'
import { NewsFeedPanel }     from '@/modules/news/NewsFeedPanel'
import { RightSidebar }      from '@/modules/news/RightSidebar'

export function TerminalLayout() {
  useRealtimeMarket()

  return (
    <>
      <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:'var(--t-surface-base)', color:'var(--t-text-primary)', fontFamily:'var(--t-font-sans)' }}>
        <TopBar />
        <WatchlistBar />
        <SessionBar />

        <div style={{ flex:1, display:'flex', minHeight:0, overflow:'hidden' }}>
          {/* Left sidebar */}
          <div style={{ width:220, flexShrink:0, borderRight:'0.5px solid var(--t-border-default)', overflow:'hidden', display:'flex', flexDirection:'column' }}>
            <NewsFeedPanel />
          </div>

          {/* Center */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>
            <WorkspaceTabs />
            <Workspace />
          </div>

          {/* Right sidebar */}
          <div style={{ width:200, flexShrink:0, borderLeft:'0.5px solid var(--t-border-default)', overflow:'hidden' }}>
            <RightSidebar />
          </div>
        </div>
      </div>
      <CommandPalette />
    </>
  )
}
