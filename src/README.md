# NEXTERM — Source Architecture

## Folder structure

```
src/
├── types/
│   ├── index.ts            Barrel export
│   └── types.ts            ALL domain types (single source of truth)
│
├── config/
│   └── index.ts            Env vars, constants, symbol config
│
├── websocket/
│   └── core/
│       └── WSClient.ts     Singleton WS with reconnect + heartbeat
│
├── features/               Feature-based modules (vertical slices)
│   ├── market/
│   │   ├── store/marketStore.ts       Zustand: ticks, selectedSymbol, connectionStatus
│   │   ├── services/MarketDataService.ts  Multi-provider: Finnhub → TwelveData → synthetic
│   │   ├── hooks/useRealtimeMarket.ts    WS → store bridge (runs once per app)
│   │   └── index.ts        Barrel export
│   │
│   ├── terminal/
│   │   ├── store/terminalUIStore.ts   Zustand: activeTab, commandOpen, squawk, clock
│   │   └── index.ts
│   │
│   ├── ai/
│   │   ├── services/AIService.ts     Claude API abstraction (client + server)
│   │   └── index.ts
│   │
│   ├── billing/
│   │   ├── services/BillingService.ts  Stripe abstraction
│   │   └── index.ts
│   │
│   ├── charts/             (chart-engine/ at root — future migration target)
│   ├── workspace/          (workspace/ at root — future migration target)
│   └── auth/               (proxy.ts + clerk — future migration target)
│
└── ui/
    ├── feedback/
    │   ├── ErrorBoundary.tsx   Class-based error boundary with retry
    │   └── Skeletons.tsx       PanelSkeleton, ChartSkeleton for Suspense
    └── index.ts            Barrel export
```

## Import conventions

```ts
// ✅ New feature modules
import { useMarketStore }     from '@/src/features/market'
import { useTerminalUIStore } from '@/src/features/terminal'
import { aiService }          from '@/src/features/ai'
import { getWSClient }        from '@/src/websocket'
import type { TickData }      from '@/src/types'

// ✅ Config constants
import { getDecimals, TIMEFRAME_SECONDS } from '@/src/config'

// ✅ UI primitives
import { ErrorBoundary, PanelSkeleton } from '@/src/ui'

// ⚠️  Legacy (backward compat shims — migrate over time)
import { useTerminalStore }  from '@/store/terminal'
import { useRealtimeMarket } from '@/hooks/useRealtimeMarket'
```

## State architecture

```
┌─────────────────────────────────────────┐
│           Zustand Stores                │
│  ┌────────────────┐  ┌───────────────┐  │
│  │  marketStore   │  │ terminalUI    │  │
│  │  - ticks       │  │ - activeTab   │  │
│  │  - selectedSym │  │ - commandOpen │  │
│  │  - connStatus  │  │ - squawk      │  │
│  └────────────────┘  └───────────────┘  │
│  ┌────────────────┐  ┌───────────────┐  │
│  │  chartManager  │  │ workspaceMgr  │  │
│  │  (chart-engine)│  │ (workspace/)  │  │
│  └────────────────┘  └───────────────┘  │
└─────────────────────────────────────────┘
         ↑ fed by
┌─────────────────────────────────────────┐
│         WebSocket Layer                 │
│  WSClient (singleton) → event handlers  │
│  → useRealtimeMarket (once per app)     │
└─────────────────────────────────────────┘
         ↑ connects to
┌─────────────────────────────────────────┐
│         server/src/index.ts             │
│  Fastify + WS server (port 3001)        │
└─────────────────────────────────────────┘
```

## Error handling

All panels should be wrapped with `<ErrorBoundary>`:

```tsx
import { ErrorBoundary, PanelSkeleton } from '@/src/ui'
import { Suspense } from 'react'

<ErrorBoundary>
  <Suspense fallback={<PanelSkeleton />}>
    <YourPanel />
  </Suspense>
</ErrorBoundary>
```

## Adding a new feature

1. Create `src/features/your-feature/{store,services,hooks,components,types}/`
2. Export public API from `src/features/your-feature/index.ts`
3. Add types to `src/types/types.ts`
4. Add any constants to `src/config/index.ts`
5. Import via: `import { ... } from '@/src/features/your-feature'`
