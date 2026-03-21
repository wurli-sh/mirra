# CLAUDE.md

## Project

Mirra — reactive copy-trading protocol on Somnia Shannon Testnet (Chain ID 50312). Leaders trade on SimpleDEX; followers' vaults mirror trades automatically via on-chain reactive subscriptions. Includes an AI chat agent ("Oni") at `/oni` that reads on-chain data and proposes transactions.

## Structure

```
contracts/               # Solidity 0.8.30, Hardhat, tests → contracts/CLAUDE.md
server/                  # Hono API server (LLM chat endpoint) → server/CLAUDE.md
  agent/                 # System prompt + tool definitions
  lib/                   # Provider, viem client, rate limiter
src/                     # React 19 + Vite frontend → src/CLAUDE.md
  components/            # Domain-grouped UI → src/components/CLAUDE.md
  hooks/                 # wagmi contract hooks → src/hooks/CLAUDE.md
  config/                # Chain, addresses (env), wagmi, ABIs
  stores/                # Zustand (ui.ts)
  lib/                   # cn, format, animations
  pages/                 # HomePage, TradePage, ChatPage
  data/                  # Shared types
```

## Commands

```bash
pnpm install             # deps
pnpm dev                 # frontend (:5173) + server (:3001) via concurrently
pnpm dev:client          # frontend only → :5173
pnpm dev:server          # server only → :3001
pnpm build               # tsc && vite build
cd contracts && npx hardhat compile
cd contracts && npx hardhat test
cd contracts && npx hardhat run scripts/deploy.ts --network somnia_testnet
```

## Contract Cascade

```
SimpleDEX → [reactive] MirrorExecutor → [reactive] RiskGuardian
                           ├── LeaderRegistry (reads)
                           ├── FollowerVault (reads + pulls tokens)
                           ├── PositionTracker (writes)
                           └── ReputationEngine (writes)
```

## Stack

- **Frontend:** React 19, Vite, wagmi v2, viem (never ethers.js), Zustand, TanStack Query, Tailwind v4, framer-motion, lucide-react, sonner (toasts)
- **Server:** Hono, Vercel AI SDK (`ai`), `ollama-ai-provider-v2` (Ollama) / `@ai-sdk/groq` (Groq), viem (server-side reads), zod
- **Contracts:** Hardhat, OpenZeppelin 5.x, `@somnia-chain/reactivity-contracts`
- **Design:** Font: Onest. Primary: #FFD5F0 (pink). Secondary: #1A1A1A (charcoal). Piggi character: Oni
- **Path alias:** `@` → `src/`

## Routing

```
/              → HomePage (hero, how-it-works, Oni section, CTA, footer)
/trade         → TradePage (unified: swap panel + tabbed leaders/positions/activity)
/leaderboard   → TradePage (alias)
/oni           → ChatPage (AI chat agent)
*              → Redirect to /
```

## Chat Agent Architecture

```
Frontend (useChat) → POST /api/chat → Hono server → streamText() with tools
  ├── Read tools: server-side viem readContract → rendered as DataCards
  ├── Write tools: return ActionCard data (swap, follow, unfollow, deposit, withdraw, etc.)
  └── ActionCard: rendered in ChatMessage, executes via wagmi useWriteContract on user confirm
```

- **LLM:** Ollama with `ollama-ai-provider-v2` (local, default qwen3:8b) or Groq (prod)
- **Personality:** Oni — piggi-themed trading sidekick with casual humor
- **DataCards:** Auto-rendered for read tool results (leaderboard, positions, balances, activity)
- **ActionCards:** Swap, follow, unfollow, deposit, withdraw, register, deregister, claimFees, approve
- **Text suppression:** Text after a DataCard/ActionCard is hidden to prevent LLM data repetition
- **Parameter aliases:** Tools accept both `tokenIn`/`fromToken` naming for qwen3 compatibility
- **Toast notifications:** Sonner toasts for tx lifecycle (pending → confirming → success/error)

### Somnia Reactivity Integration

On-chain reactivity is the core primitive: SimpleDEX Swap → reactively triggers MirrorExecutor → RiskGuardian, PositionTracker, ReputationEngine. The server watches events via viem `watchContractEvent` over WebSocket. Events are cached in a 50-event ring buffer and broadcast via SSE (`GET /api/events`). The LLM's `get_recent_trades` tool reads from this cache. The frontend TradeFeed and chat DataCard consume the SSE stream via `useReactiveEvents()` hook.

## Somnia Gas Constraints

Cold SLOAD/CALL: 1M gas each. MAX_FOLLOWERS_PER_MIRROR = 5. Use `bytes32 constant` for event sigs. Paginated `getFollowers(offset, limit)`.

## Important: Multicall3 Not Deployed

Somnia testnet does NOT have Multicall3. wagmi config has `batch: { multicall: false }` to prevent silent failures from `useReadContracts`.

## Env

Frontend: `VITE_*` contract addresses + `VITE_WC_PROJECT_ID`. Contracts: `PRIVATE_KEY` for deploy.
Server: `LLM_PROVIDER` (ollama|groq), `GROQ_API_KEY`, `OLLAMA_MODEL`, `OLLAMA_BASE_URL`. Server also reads `VITE_*` via dotenv.

## Subdirectory Guides

- [contracts/CLAUDE.md](contracts/CLAUDE.md)
- [server/CLAUDE.md](server/CLAUDE.md)
- [src/CLAUDE.md](src/CLAUDE.md)
- [src/components/CLAUDE.md](src/components/CLAUDE.md)
- [src/hooks/CLAUDE.md](src/hooks/CLAUDE.md)
