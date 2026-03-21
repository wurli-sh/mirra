# server/CLAUDE.md

## Overview

Hono server providing `POST /api/chat` (AI agent), `GET /api/events` (SSE), and session key endpoints for autonomous execution. Runs via `tsx watch` on port 3001. Vite proxies `/api` to it in dev.

## Structure

```
server/
├── index.ts               # Hono app, CORS, /api/chat, /api/events, /api/session endpoints
├── tsconfig.json          # Extends root paths, includes src/config/abi
├── lib/
│   ├── provider.ts        # getModels() — Ollama (ollama-ai-provider-v2) or Groq
│   ├── viem-client.ts     # publicClient for Somnia (http transport with retry) + contract addresses + TOKEN_MAP
│   ├── rate-limit.ts      # In-memory sliding window rate limiter + IP detection
│   ├── reactive-stream.ts # WebSocket event watcher, ring buffer, SSE broadcast
│   ├── session-store.ts   # In-memory session key store (30-min TTL, spending cap, toJSON guard)
│   └── session-executor.ts # Creates walletClient from session key, executes on-chain txs
└── agent/
    ├── system-prompt.ts   # buildSystemPrompt(userAddress?, hasActiveSession?) — Oni personality
    └── tools/
        ├── index.ts       # buildTools(userAddress, session?) — routes to executable or ActionCard tools
        ├── read-leaders.ts    # get_leaders, get_leader_stats (accepts truncated addresses), is_leader
        ├── read-protocol.ts   # get_protocol_stats
        ├── read-positions.ts  # get_user_positions (named struct fields, not tuple indices)
        ├── read-dex.ts        # get_amount_out (accepts fromToken/toToken aliases), get_reserves, get_token_balances
        ├── read-recent.ts     # get_recent_trades (from WebSocket event cache)
        ├── write-actions.ts   # request_swap (aliases), request_follow (defaults) — returns ActionCard data
        └── write-execute.ts   # Executable versions of write tools — execute on-chain via session key
```

## Request Flow

1. Client sends `{ messages: UIMessage[], userAddress?: string }` to `POST /api/chat`
2. Server validates address with `isAddress()`, trims to last 16 messages
3. Builds system prompt and tools (user-specific tools closed over address)
4. Calls `streamText()` with model, returns `toUIMessageStreamResponse()`
5. Rate limit: 20 messages/minute per IP

## LLM Providers

| Provider | Env | Package | Models |
|----------|-----|---------|--------|
| Ollama (default) | `LLM_PROVIDER=ollama` | `ollama-ai-provider-v2` | `OLLAMA_MODEL` or `qwen3:8b` |
| Groq | `LLM_PROVIDER=groq`, `GROQ_API_KEY` | `@ai-sdk/groq` | `llama-3.1-8b-instant` → `llama-3.3-70b-versatile` fallback |

Note: Uses `ollama-ai-provider-v2` (native `/api/chat` endpoint) instead of `@ai-sdk/openai-compatible` — the latter doesn't handle qwen3's tool calling correctly.

## Tool Architecture

**Read tools** execute server-side via `publicClient.readContract()`:
- `get_leaders` — All leaders with scores, PnL, volume, followers, shortAddress
- `get_leader_stats` — Single leader stats (accepts truncated addresses like "0xFbc8...E066")
- `is_leader` — Boolean check
- `get_protocol_stats` — Aggregate counts + volume
- `get_user_positions` — User's active follow positions (named struct fields)
- `get_amount_out` — DEX swap quote (accepts `tokenIn`/`fromToken` aliases for qwen3 compat)
- `get_reserves` — Pool liquidity
- `get_recent_trades` — Last N events from WebSocket event cache
- `get_token_balances` — STT/USDC/WETH balances (needs `userAddress`)

**Write tools** return ActionCard data (frontend executes via wagmi):
- `request_swap` — Swap tokens (accepts `fromToken`/`toToken`/`amount` aliases)
- `request_follow` — Follow leader (defaults: 10 STT deposit, 5 max/trade, 300 bps, 5 STT stop loss; resolves truncated addresses)
- `request_unfollow` — Stop following
- `request_deposit_more` — Add to position
- `request_withdraw` — Reduce position
- `request_register_leader` — Register with STT stake
- `request_deregister` — Deregister as leader
- `request_claim_fees` — Claim leader fees
- `request_approve` — ERC20 approval (description clarifies followerVault vs simpleDex usage)

## Somnia Reactivity

`server/lib/reactive-stream.ts` watches Swap + MirrorExecuted events via viem `watchContractEvent` over WebSocket. Events are stored in a 50-event ring buffer and broadcast to SSE clients via `eventEmitter`. The on-chain reactivity (contract-to-contract reactive subscriptions) is the core Somnia primitive — the server event watching is the frontend complement.

`GET /api/events` is an SSE endpoint. On connect, it sends a `connected` event, then cached events, then streams new events. A 30s heartbeat keeps the connection alive.

## Conventions

- Server files use `@ts-nocheck` in tool files — zod + AI SDK tool() type inference issues
- Contract addresses loaded from `process.env.VITE_*` via `dotenv/config`
- ABIs imported from `src/config/abi/` (shared with frontend)
- `resolveToken()` maps symbol names (STT, USDC, WETH) to addresses
- Position structs use named fields (e.g. `pos.active`, `pos.depositedSTT`) — NOT tuple indices
- `stopWhen: stepCountIs(3)` limits agent to 3 tool call rounds per message
- viem transport configured with `retryCount: 3, retryDelay: 500, timeout: 10_000` for transient RPC failures
