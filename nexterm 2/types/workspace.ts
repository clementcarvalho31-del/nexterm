export type PanelId =
  | 'news-feed'
  | 'order-book'
  | 'chart-eurusd'
  | 'chart-gbpusd'
  | 'chart-usdjpy'
  | 'cot'
  | 'calendar'
  | 'sentiment'
  | 'worldbook'
  | 'seasonality'
  | 'liquidity'
  | 'bias'
  | 'bank-research'
  | 'newsplay'
  | 'ai-copilot'
  | 'yields'
  | 'flows'
  | 'copilot'

export interface GridPosition {
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
}

export interface PanelConfig {
  id: PanelId
  title: string
  position: GridPosition
  visible: boolean
  minimized: boolean
}

export interface WorkspaceLayout {
  id: string
  name: string
  panels: PanelConfig[]
}

export const WORKSPACE_PRESETS: Record<string, Omit<WorkspaceLayout, 'id'>> = {
  default: {
    name: 'Default',
    panels: [
      { id: 'news-feed',    title: 'Macro News',    position: { x: 0, y: 0, w: 3, h: 8, minW: 2, minH: 4 }, visible: true, minimized: false },
      { id: 'chart-eurusd', title: 'EUR/USD',        position: { x: 3, y: 0, w: 6, h: 8, minW: 3, minH: 4 }, visible: true, minimized: false },
      { id: 'cot',          title: 'COT',            position: { x: 9, y: 0, w: 3, h: 8, minW: 2, minH: 4 }, visible: true, minimized: false },
      { id: 'calendar',     title: 'Eco Calendar',  position: { x: 0, y: 8, w: 6, h: 6, minW: 3, minH: 4 }, visible: true, minimized: false },
      { id: 'sentiment',    title: 'DXM Sentiment', position: { x: 6, y: 8, w: 3, h: 6, minW: 2, minH: 3 }, visible: true, minimized: false },
      { id: 'bias',         title: 'Bias',           position: { x: 9, y: 8, w: 3, h: 6, minW: 2, minH: 3 }, visible: true, minimized: false },
    ],
  },
  analysis: {
    name: 'Deep Analysis',
    panels: [
      { id: 'chart-eurusd', title: 'EUR/USD',       position: { x: 0, y: 0, w: 6, h: 8, minW: 3, minH: 4 }, visible: true, minimized: false },
      { id: 'chart-gbpusd', title: 'GBP/USD',       position: { x: 6, y: 0, w: 6, h: 8, minW: 3, minH: 4 }, visible: true, minimized: false },
      { id: 'cot',          title: 'COT',            position: { x: 0, y: 8, w: 4, h: 6, minW: 2, minH: 4 }, visible: true, minimized: false },
      { id: 'seasonality',  title: 'Seasonality',   position: { x: 4, y: 8, w: 4, h: 6, minW: 3, minH: 4 }, visible: true, minimized: false },
      { id: 'worldbook',    title: 'Worldbook',     position: { x: 8, y: 8, w: 4, h: 6, minW: 3, minH: 4 }, visible: true, minimized: false },
    ],
  },
  news: {
    name: 'News Trading',
    panels: [
      { id: 'news-feed',    title: 'News Feed',     position: { x: 0, y: 0, w: 4, h: 14, minW: 2, minH: 6 }, visible: true, minimized: false },
      { id: 'newsplay',     title: 'Scenarios',     position: { x: 4, y: 0, w: 5, h: 8,  minW: 3, minH: 4 }, visible: true, minimized: false },
      { id: 'calendar',     title: 'Calendar',      position: { x: 9, y: 0, w: 3, h: 8,  minW: 2, minH: 4 }, visible: true, minimized: false },
      { id: 'ai-copilot',   title: 'AI Copilot',    position: { x: 4, y: 8, w: 8, h: 6,  minW: 3, minH: 4 }, visible: true, minimized: false },
    ],
  },
}
