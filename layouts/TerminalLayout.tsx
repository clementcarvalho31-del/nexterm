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
import { CalendarPanel }     from '@/modules/calendar/CalendarPanel'
import { SentimentPanel }    from '@/modules/sentiment/SentimentPanel'
import { LiveFeedPanel }     from '@/modules/livefeed/LiveFeedPanel'
import { useTerminalStore }  from '@/store/terminal'

const FULLSCREEN_STYLE = {
  display:'flex' as const, flexDirection:'column' as const,
  height:'100vh', overflow:'hidden',
  background:'var(--t-surface-base)', color:'var(--t-text-primary)',
  fontFamily:'var(--t-font-sans)',
}

function TerminalInner() {
  useRealtimeMarket()
  const activeTab = useTerminalStore(s => s.activeTab)

  if (activeTab === 'calendar') {
    return (
      <div style={FULLSCREEN_STYLE}>
        <TopBar />
        <div style={{ flex:1, minHeight:0, overflow:'hidden' }}><CalendarPanel /></div>
      </div>
    )
  }

  if (activeTab === 'cot') {
    return (
      <div style={FULLSCREEN_STYLE}>
        <TopBar />
        <div style={{ flex:1, minHeight:0, overflow:'hidden' }}><SentimentPanel /></div>
      </div>
    )
  }

  if (activeTab === 'livefeed') {
    return (
      <div style={FULLSCREEN_STYLE}>
        <TopBar />
        <div style={{ flex:1, minHeight:0, overflow:'hidden' }}><LiveFeedPanel /></div>
      </div>
    )
  }

  return (
    <div style={FULLSCREEN_STYLE}>
      <TopBar />
      <WatchlistBar />
      <SessionBar />
      <div style={{ flex:1, display:'flex', minHeight:0, overflow:'hidden' }}>
        <div style={{ width:220, flexShrink:0, borderRight:'0.5px solid var(--t-border-default)', overflow:'hidden', display:'flex', flexDirection:'column' }}>
          <NewsFeedPanel />
        </div>
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>
          <WorkspaceTabs />
          <Workspace />
        </div>
        <div style={{ width:200, flexShrink:0, borderLeft:'0.5px solid var(--t-border-default)', overflow:'hidden' }}>
          <RightSidebar />
        </div>
      </div>
    </div>
  )
}

export function TerminalLayout() {
  return (
    <>
      <TerminalInner />
      <CommandPalette />
    </>
  )
}
