# src/CLAUDE.md

## Overview

React 19 frontend built with Vite, wagmi v2, viem, and Tailwind CSS v4. Connects to Somnia Shannon Testnet contracts. Includes an AI chat agent page at `/oni`.

## Entry Points

- `main.tsx` — renders `<App />` into `#root`
- `App.tsx` — providers stack: WagmiProvider → QueryClientProvider → BrowserRouter + Sonner Toaster
- `app.css` — Tailwind v4 `@theme` block with all design tokens

## Routing

Three pages inside `<MainLayout>` (navbar + content wrapper):
- `/` → `HomePage` (landing: hero, how-it-works, Oni section, CTA, footer)
- `/trade` → `TradePage` (unified: swap panel + tabbed leaders/positions/activity)
- `/oni` → `ChatPage` (AI chat agent with Oni piggi personality)
- `*` → Redirect to `/`

## Provider Stack

```
WagmiProvider (config from config/wagmi.ts, multicall: false)
  └── QueryClientProvider (staleTime: 10s, retry: 2)
       └── BrowserRouter
            └── Routes
```

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `components/` | UI components organized by domain — see [components/CLAUDE.md](components/CLAUDE.md) |
| `hooks/` | wagmi contract read/write hooks — see [hooks/CLAUDE.md](hooks/CLAUDE.md) |
| `config/` | Chain definition, contract addresses (from env), wagmi config (multicall disabled), ABI JSON files |
| `stores/` | Zustand stores — `ui.ts` (tabs, follow modal state) |
| `lib/` | Utilities: `cn.ts` (clsx+twMerge), `format.ts` (numbers/addresses), `animations.ts` (framer-motion variants) |
| `pages/` | Route-level page components composing domain components |
| `data/` | Shared TypeScript types (`types.ts`) |
| `assets/` | Static images (gateway cards, etc.) |

## Chat Agent Frontend

The chat agent lives at `/oni` with Oni piggi personality.

Key components in `components/chat/`:
- `ChatPanel` — Main container using `useChat()` from `@ai-sdk/react`, session storage persistence, randomized loading labels
- `ChatMessage` — Renders markdown (react-markdown + remark-gfm), detects tool results → ActionCards or DataCards. Suppresses text after cards to prevent LLM data repetition.
- `ChatInput` — Auto-resizing textarea with Enter-to-send
- `SuggestedPrompts` — Quick prompt buttons for common queries
- `ActionCard` — Wagmi-based transaction execution (9 action types) with toast notifications, follow-up quick action buttons, sessionStorage state persistence
- `DataCard` — Auto-rendered cards for read tool results (leaderboard table, positions, balances, protocol stats, recent activity with live SSE)

UI primitives in `components/ui/`:
- `OniAvatar` — Piggi SVG avatar with `bare` prop for no-bg mode
- `TextShimmer` — Character shimmer animation for loading states
- `TextLoop` — Cycling text with framer-motion transitions
- `ThinkingSpinner` — SVG 4x4 grid with pulsing animation

## Conventions

- Path alias `@` → `src/` (configured in vite.config.ts)
- Use `viem` types (`Address`, `Hash`) — never ethers.js
- Contract addresses loaded from `VITE_*` env vars in `config/contracts.ts`
- Wallet connectors: MetaMask, Coinbase Wallet, WalletConnect (optional via `VITE_WC_PROJECT_ID`)
- wagmi multicall disabled (`batch: { multicall: false }`) — Somnia has no Multicall3
- Animations: use shared variants from `lib/animations.ts`, prefer `scrollViewport` (once: true) for scroll-triggered animations
- Styling: Tailwind utility classes, theme tokens via CSS custom properties — no hardcoded hex colors
- Toast notifications: sonner with frosted glass charcoal theme, positioned top-right
