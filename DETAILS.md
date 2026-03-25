# Mirra - Reactive Copy-Trading with Autonomous AI Agent

---

## Overview

Mirra is a reactive copy-trading protocol on Somnia. One leader swap triggers an automatic cascade — mirror execution, risk checks, reputation scoring — across 5 contracts in the same block. No bots. No backend. Just Somnia Reactivity.

It also ships with **Oni**, an AI agent that executes trades autonomously via session keys. Zero wallet popups after a one-time setup.

---

## The Problem

### 1. Copy-Trading Relies on Bots
- Off-chain bots watch leader wallets and submit mirror trades
- Bots add latency (followers execute blocks later), can front-run, and go offline
- Someone has to run, fund, and maintain the infrastructure
- When the bot fails, followers miss trades

### 2. No On-Chain Risk Enforcement
- Stop-loss and slippage protection are handled off-chain
- If the bot crashes during a volatile period, followers eat the loss
- No atomic guarantee that risk checks execute alongside the mirror trade

### 3. DeFi UX Kills Adoption
- Every action requires a wallet popup (approve, confirm, sign)
- A simple swap involves 2-3 wallet interactions
- Users must understand gas, slippage, and transaction flows
- Non-crypto-native users can't participate

---

## How Mirra Solves Them

### 1. Reactive Mirroring — No Bots
- Leader swaps on SimpleDEX
- `MirrorExecutor._onEvent()` fires via Somnia Reactivity (Subscription #1)
- Pulls tokens from FollowerVault, executes proportional swap, updates position + reputation
- All in the **same block** as the leader's trade
- No off-chain process involved

### 2. Reactive Risk Enforcement — Same Block
- `MirrorExecuted` event triggers `RiskGuardian._onEvent()` (Subscription #2)
- Checks stop-loss threshold on-chain
- Emergency-closes position if losses exceed the limit
- Happens atomically — risk check is guaranteed, not best-effort

### 3. AI Agent with Session Keys — Zero Popups
- User says "swap 10 STT for USDC" to Oni
- Server signs and submits the tx using a server-generated ephemeral key
- User only signs once (EIP-191 auth) and funds the session wallet
- Session expires in 30 min, spending capped at 50 STT
- Falls back to manual confirmation when session wallet is low

---

## Somnia Reactivity Usage

### On-Chain (Contracts)
- `MirrorExecutor` inherits `SomniaEventHandler`, overrides `_onEvent()`
- `RiskGuardian` inherits `SomniaEventHandler`, overrides `_onEvent()`
- Both invoked directly by Somnia validators when subscribed events fire

### On-Chain Subscriptions (3 chained)
- **#1:** SimpleDEX Swap → MirrorExecutor (mirror trades)
- **#2:** MirrorExecuted → RiskGuardian (risk checks)
- **#3:** MirrorContinue → MirrorExecutor (pagination for >5 followers)
- Registered via `sdk.createSoliditySubscription()` with `isGuaranteed: true`

### Off-Chain (Server)
- Server uses `sdk.subscribe()` via `somnia_watch` for native push events
- Events flow into 50-event ring buffer → SSE → frontend Activity feed + LLM tools
- Automatic fallback to viem `watchContractEvent` if SDK fails

---

## Reactive Cascade (Single Swap)

```
Leader swaps on SimpleDEX
    |
    v  Subscription #1
MirrorExecutor
    |-- pulls tokens from FollowerVault
    |-- swaps proportionally on SimpleDEX
    |-- updates PositionTracker
    |-- updates ReputationEngine
    |-- emits MirrorExecuted
    |
    v  Subscription #2
RiskGuardian
    |-- checks stop-loss
    |-- emergency closes if breached
    |
    v  Subscription #3 (if >5 followers)
MirrorExecutor (next batch, paginated)
```

**7 contracts. 2 reactive handlers. 3 chained subscriptions. One block.**

---

## Key Features

### Copy-Trading
- Leaders register by staking 10+ STT
- Followers deposit into non-custodial vaults with configurable max-per-trade, slippage, and stop-loss
- Mirror trades execute proportionally in the same block
- Reputation engine scores leaders: 60% win rate + 20% volume + 20% recency

### AI Agent (Oni)
- 18 AI tools — 9 read (leaders, positions, balances, quotes, activity) + 9 write (swap, follow, deposit, etc.)
- Session keys: server-generated, EIP-191 authenticated, 30-min TTL, 50 STT cap
- When session wallet is low, falls back to manual ActionCards
- Live activity streaming via SSE powered by Somnia Reactivity SDK

### Security
- Server-generated keys — private key never leaves the server
- `toJSON` guard strips private key from any serialization
- Spending cap + operation limit per session
- Contract address whitelist on all writes
- Rate limiting, CORS, input validation, sanitized errors

---

## Tech Stack

| Layer | Stack |
|-------|-------|
| **Contracts** | Solidity 0.8.30, Hardhat, OpenZeppelin 5.x, @somnia-chain/reactivity-contracts |
| **Reactivity** | @somnia-chain/reactivity SDK (on-chain + off-chain) |
| **Frontend** | React 19, Vite, TypeScript, Tailwind v4, wagmi v2, viem, framer-motion |
| **Server** | Hono, Vercel AI SDK, viem |
| **LLM (local)** | Ollama + Qwen 3 8B |
| **LLM (prod)** | Groq + Llama 3.1 8B / Llama 3.3 70B |

## Links

- **GitHub:** [github.com/wurli-sh/mirra](https://github.com/wurli-sh/mirra)
- **Explorer:** [shannon-explorer.somnia.network](https://shannon-explorer.somnia.network)
- **SimpleDEX:** `0x29be601cD09b6CF0429721895680b7dbDFE7fB5E`
- **LeaderRegistry:** `0x485b7673299A2Ef4Ce8f911E414bE2758FE9c8a2`
- **FollowerVault:** `0x8F4d404ADC5b7a1e6D2A355FA9c64Df3cC62096b`
- **MirrorExecutor:** `0x181B8A52282D66bB6122d84Dbb442d141502Dc92`
- **RiskGuardian:** `0xA4d4318067a6be92ef76Ca61973D7FFFB5f3FAdd`
- **PositionTracker:** `0x50292552Bd6E8Ab14321d6581795dB0934e39f60`
- **ReputationEngine:** `0x55DDb2Ef336FB32764cE4F17F9264aF97F9fb219`

---

## Future Enhancements

- **Mainnet deployment** — Migrate to Somnia mainnet when Reactivity goes live
- **Cross-chain mirroring** — Mirror leader trades across chains via Somnia cross-chain reactivity
- **Leader fee distribution** — Reactive fee accrual and auto-payout to leaders on profitable mirrors
- **Advanced risk strategies** — Trailing stop-loss, take-profit triggers, and volatility-based position sizing — all reactive
- **Multi-token vaults** — Support deposits in USDC/WETH alongside STT for diversified follow positions
- **Persistent session keys** — Hardware wallet delegation for longer-lived autonomous sessions
- **Social layer** — On-chain leader profiles, follower comments, and trade strategy sharing
- **Mobile-first AI agent** — Optimized Oni interface for mobile with push notifications on mirror events

---

Mirra turns one leader's swap into an instant, trustless cascade — reactive mirroring, risk enforcement, and reputation scoring across 5 contracts in the same block, all driven by an autonomous AI agent.
