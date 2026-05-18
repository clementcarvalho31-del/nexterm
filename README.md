# ⬡ NEXTERM — Institutional FX Terminal

Production-grade real-time macro FX terminal. Bloomberg/Prime Market Terminal-inspired SaaS.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, TailwindCSS |
| State | Zustand + subscribeWithSelector |
| Animation | Framer Motion |
| Charts | TradingView Lightweight Charts v5 |
| Workspace | react-grid-layout v1.4 (draggable panels) |
| Command | cmdk (CMD+K palette) |
| Auth | Clerk |
| Payments | Stripe |
| Database | Prisma + PostgreSQL |
| Realtime | Fastify WebSocket server |
| AI | Claude (Anthropic API) |

## Quick Start

\`\`\`bash
# 1. Install frontend deps
npm install

# 2. Copy env template
cp .env.example .env.local
# → Fill in your API keys (see below)

# 3. Setup database (requires PostgreSQL running)
npx prisma migrate dev --name init
npx prisma generate

# 4. Start WebSocket server  (terminal 1)
cd server && npm install && npm run dev
# → Runs on ws://localhost:3001/ws

# 5. Start Next.js  (terminal 2)
npm run dev
# → Runs on http://localhost:3000
\`\`\`

## Architecture

\`\`\`
nexterm/
├── app/
│   ├── api/
│   │   ├── ai/chat/          ← Claude Sonnet copilot
│   │   ├── market/snapshot/  ← Prices (Finnhub → synthetic fallback)
│   │   └── stripe/           ← Checkout + webhook
│   └── page.tsx
│
├── server/                   ← Standalone Fastify WS server
│   └── src/index.ts          ← Market engine, tick broadcast, heartbeat
│
├── components/
│   ├── chart/ChartPanel.tsx  ← TradingView Lightweight Charts (realtime)
│   ├── command/CommandPalette.tsx  ← CMD+K fuzzy search
│   ├── terminal/             ← TopBar, WatchlistBar, SessionBar, Tabs
│   └── workspace/
│       ├── DraggableWorkspace.tsx  ← react-grid-layout panels
│       └── AICopilot.tsx           ← AI chat (context-aware)
│
├── lib/
│   └── websocket/WSManager.ts  ← Singleton WS client (reconnect + heartbeat)
│
├── store/
│   ├── terminal.ts    ← Market ticks, UI, connection status (Zustand)
│   └── workspace.ts   ← Layout persistence (localStorage)
│
├── modules/           ← COT, Calendar, NewsPlay, Seasonality, Worldbook, Liquidity
├── services/market/   ← Multi-provider: Finnhub → TwelveData → synthetic
├── hooks/
│   └── useRealtimeMarket.ts  ← WS → Zustand bridge
├── types/
│   ├── market.ts      ← CurrencyPair, Candle, OrderBook...
│   ├── websocket.ts   ← WSMessage, TickData, CandleData...
│   ├── workspace.ts   ← PanelId, GridPosition, layout presets
│   └── auth.ts        ← UserRole, SubscriptionStatus, hasAccess()
└── prisma/schema.prisma  ← User, Subscription, Workspace, Alert
\`\`\`

## Features

### Realtime Engine
- Fastify WebSocket server with auto-reconnect + heartbeat (15s)
- Symbol subscription system per client
- Tick batching every 800ms
- Snapshot REST endpoint for initial state
- Synthetic price fallback when no API key configured

### Charts (TradingView Lightweight Charts v5)
- Institutional dark theme
- Realtime candle updates from WS ticks
- Multi-timeframe selector M1/M5/M15/H1/H4/D1
- Auto-resize via ResizeObserver
- EUR/USD, GBP/USD, USD/JPY

### Draggable Workspace (Bloomberg-style)
- react-grid-layout: drag panels freely, resize from edges/corners
- 3 layout presets: Default, Deep Analysis, News Trading
- Panel minimize (collapse to header) / close
- Layout persistence via localStorage (Zustand persist middleware)

### Command Palette (CMD+K)
- Instant fuzzy search over pairs, modules, events
- Keyboard-first: arrow keys + Enter
- Commands: EURUSD, GBPUSD, DXY, NEWS, CALENDAR, NFP, CPI, FOMC, COT, SQUAWK

### AI Copilot
- Claude Sonnet 4 — context-aware terminal assistant
- Receives live prices, news feed, COT, high-impact calendar as system context
- Quick prompts: session summary, move explanation, NFP scenarios
- Full conversation history (last 10 turns)

### SaaS Foundation
- Clerk auth: email + Google OAuth, magic links
- 3-day free trial via Stripe trial_period_days
- \$49/month subscription
- Roles: USER / PREMIUM / ADMIN
- Admin: bypasses all Stripe/expiry checks permanently
- Stripe webhook: subscription lifecycle events
- Stripe customer portal (self-service cancel/upgrade)

## API Keys

| Service | Free Tier | Link |
|---|---|---|
| Finnhub | 60 req/min | finnhub.io |
| TwelveData | 8 req/min | twelvedata.com |
| Clerk | 10K MAU | clerk.com |
| Stripe | Test mode unlimited | stripe.com |
| Anthropic | Pay per token | console.anthropic.com |

> Note: All market data falls back to synthetic simulation if no API key is set.
> The terminal is fully functional without any API keys in development.

## Deployment

### Frontend → Vercel
\`\`\`bash
vercel deploy
# Set all .env.example vars in Vercel dashboard
\`\`\`

### WS Server → Railway / Render / Fly.io
\`\`\`bash
cd server
npm run build
# Deploy dist/index.js, set WS_PORT=3001
\`\`\`

### Database → Neon / Supabase / PlanetScale
\`\`\`bash
DATABASE_URL=postgresql://...
npx prisma migrate deploy
\`\`\`

