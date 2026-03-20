# src/CLAUDE.md

## Overview

React 19 frontend built with Vite, wagmi v2, viem, and Tailwind CSS v4. Connects to Somnia Shannon Testnet contracts.

## Entry Points

- `main.tsx` — renders `<App />` into `#root`
- `App.tsx` — providers stack: WagmiProvider → QueryClientProvider → BrowserRouter
- `app.css` — Tailwind v4 `@theme` block with all design tokens

## Routing

Three pages inside `<MainLayout>` (navbar + content wrapper):
- `/` → `HomePage` (landing: hero, how-it-works, protocol gateway, CTA, footer)
- `/leaderboard` → `LeaderboardPage` (leader table, ranking chart, follow modal)
- `/trade` → `TradePage` (swap panel, positions, deposits)

## Provider Stack

```
WagmiProvider (config from config/wagmi.ts)
  └── QueryClientProvider (staleTime: 10s, retry: 2)
       └── BrowserRouter
            └── Routes
```

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `components/` | UI components organized by domain — see [components/CLAUDE.md](components/CLAUDE.md) |
| `hooks/` | wagmi contract read/write hooks — see [hooks/CLAUDE.md](hooks/CLAUDE.md) |
| `config/` | Chain definition, contract addresses (from env), wagmi config, ABI JSON files |
| `stores/` | Zustand stores — currently `ui.ts` (tabs, follow modal state) |
| `lib/` | Utilities: `cn.ts` (clsx+twMerge), `format.ts` (numbers/addresses), `animations.ts` (framer-motion variants) |
| `pages/` | Route-level page components composing domain components |
| `data/` | Shared TypeScript types (`types.ts`) |
| `assets/` | Static images (gateway cards, etc.) |

## Conventions

- Path alias `@` → `src/` (configured in vite.config.ts)
- Use `viem` types (`Address`, `Hash`) — never ethers.js
- Contract addresses loaded from `VITE_*` env vars in `config/contracts.ts`
- Wallet connectors: MetaMask, Coinbase Wallet, WalletConnect (optional via `VITE_WC_PROJECT_ID`)
- Animations: use shared variants from `lib/animations.ts`, prefer `scrollViewport` (once: true) for scroll-triggered animations
- Styling: Tailwind utility classes, theme tokens via CSS custom properties
