'use client'
import type { WidgetId } from '@/workspace/types'
import { UnifiedChart } from '@/chart-engine/components/UnifiedChart'
import { NewsFeedPanel }      from '@/modules/news/NewsFeedPanel'
import { COTPanel }           from '@/modules/cot/COTPanel'
import { CalendarPanel }      from '@/modules/calendar/CalendarPanel'
import { NewsPlayPanel }      from '@/modules/newsplay/NewsPlayPanel'
import { SeasonalityPanel }   from '@/modules/seasonality/SeasonalityPanel'
import { WorldbookPanel }     from '@/modules/worldbook/WorldbookPanel'
import { LiquidityPanel }     from '@/modules/liquidity/LiquidityPanel'
import { YieldsPanel }        from '@/modules/yields/YieldsPanel'
import { FlowsPanel }         from '@/modules/flows/FlowsPanel'
import { CopilotPanel }       from '@/modules/copilot/CopilotPanel'
import { SessionPrepPanel }   from '@/modules/sessionprep/SessionPrepPanel'
import { RightSidebar }       from '@/modules/news/RightSidebar'

interface WidgetRendererProps {
  widgetId:   WidgetId
  instanceId: string
  onFullscreen?: () => void
}

export function WidgetRenderer({ widgetId, instanceId, onFullscreen }: WidgetRendererProps) {
  switch (widgetId) {
    case 'chart':        return <UnifiedChart instanceId={instanceId} className="h-full" onFullscreen={onFullscreen} />
    case 'news-feed':    return <NewsFeedPanel />
    case 'cot':          return <COTPanel />
    case 'calendar':     return <CalendarPanel />
    case 'newsplay':     return <NewsPlayPanel />
    case 'seasonality':  return <SeasonalityPanel />
    case 'worldbook':    return <WorldbookPanel />
    case 'liquidity':    return <LiquidityPanel />
    case 'yields':       return <YieldsPanel />
    case 'flows':        return <FlowsPanel />
    case 'copilot':      return <CopilotPanel />
    case 'session-prep': return <SessionPrepPanel />
    case 'bank-research':return <RightSidebar />
    case 'sentiment':    return <RightSidebar />
    case 'bias':         return <RightSidebar />
    case 'macro-radar':  return <RightSidebar />
    case 'order-book':   return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'#5a6373',fontSize:9}}>ORDER BOOK — coming soon</div>
    default:             return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'#5a6373',fontSize:9}}>{widgetId}</div>
  }
}
