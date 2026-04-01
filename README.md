<div align="center">
  <img src="./assets/mirra.png" width="100%" alt="mirra" />
</div>

**Winner of the [Somnia Reactivity Hackathon](https://dorahacks.io/hackathon/somnia-reactivity/winner).**

Reactive copy-trading on Somnia. Leader trades auto-mirrored in the same block—no bots or backend. Includes Oni, an AI agent executing trades via session keys.

[Demo Video](https://youtu.be/Gt_PvXdaq-0)

## Deployed on Somnia Shannon Testnet

| Resource             | Address                                                                    |
| -------------------- | -------------------------------------------------------------------------- |
| **Chain**            | Somnia Shannon Testnet (Chain ID `50312`)                                  |
| **RPC**              | `https://dream-rpc.somnia.network/`                                        |
| **Explorer**         | [shannon-explorer.somnia.network](https://shannon-explorer.somnia.network) |
| **SimpleDEX**        | `0x29be601cD09b6CF0429721895680b7dbDFE7fB5E`                               |
| **LeaderRegistry**   | `0x485b7673299A2Ef4Ce8f911E414bE2758FE9c8a2`                               |
| **FollowerVault**    | `0x8F4d404ADC5b7a1e6D2A355FA9c64Df3cC62096b`                               |
| **MirrorExecutor**   | `0x181B8A52282D66bB6122d84Dbb442d141502Dc92`                               |
| **RiskGuardian**     | `0xA4d4318067a6be92ef76Ca61973D7FFFB5f3FAdd`                               |
| **PositionTracker**  | `0x50292552Bd6E8Ab14321d6581795dB0934e39f60`                               |
| **ReputationEngine** | `0x55DDb2Ef336FB32764cE4F17F9264aF97F9fb219`                               |

---

## Architecture

```
Leader swaps on SimpleDEX
       |
       v  Swap event (on-chain)
  +------------------------+
  |   MirrorExecutor       |  <-- Somnia Reactivity subscription #1
  |   pulls vault -> swaps |
  |   -> updates position  |
  |   -> updates reputation|
  +----------+-------------+
             |
             v  MirrorExecuted event
  +------------------------+
  |   RiskGuardian         |  <-- Somnia Reactivity subscription #2
  |   checks stop-loss     |
  |   -> emergency close   |
  +------------------------+

  MirrorContinue event --> MirrorExecutor (subscription #3, paginated fan-out)
```

```
Frontend (React 19 + Vite)
  |  useChat (@ai-sdk/react)
  v
Hono Server (:3001)
  |-- POST /api/chat         LLM + tool calling (read/write on-chain)
  |-- POST /api/session       Session key creation (EIP-191 auth)
  |-- GET  /api/events        SSE live event stream (Somnia Reactivity SDK)
  v
Smart Contracts (Solidity 0.8.30)
  SimpleDEX -> MirrorExecutor -> RiskGuardian
                    |-> FollowerVault
                    |-> PositionTracker
                    |-> ReputationEngine
```

### Directory Structure

```
mirra/
├── contracts/           # Solidity 0.8.30, Hardhat, OpenZeppelin 5.x
│   ├── src/             # 7 contracts + interfaces
│   └── scripts/         # Deploy + setup-subscriptions (Reactivity SDK)
├── server/              # Hono API server
│   ├── lib/             # Provider, viem client, rate limiter, session store
│   └── agent/           # System prompt + 18 AI tools (read + write)
├── src/                 # React 19 + Vite frontend
│   ├── components/      # Domain-grouped (chat/, trade/, home/, layout/, ui/)
│   ├── hooks/           # wagmi contract hooks + session balance
│   ├── config/          # Chain, contracts, wagmi, ABIs
│   ├── stores/          # Zustand (ui.ts, session.ts)
│   └── pages/           # HomePage, TradePage, ChatPage (Oni Agent)
└── docs/                # Images and assets
```

---

## Key Features

### Reactive Copy-Trading

- Leaders register by staking STT, followers deposit into non-custodial vaults
- Leader swap on SimpleDEX triggers `MirrorExecutor._onEvent()` via Somnia Reactivity
- Follower trades mirror proportionally in the same block
- `RiskGuardian` enforces stop-loss limits reactively
- `ReputationEngine` tracks score, win rate, PnL on-chain

### Autonomous AI Agent (Oni)

- Chat-based interface at `/oni` powered by Ollama (local) or Groq (prod)
- 9 read tools (leaders, positions, balances, quotes, activity) + 9 write tools (swap, follow, deposit, etc.)
- **Session keys**: Server-generated ephemeral wallets for zero-popup autonomous execution
- Balance pre-checks with graceful fallback to manual ActionCards
- Live event streaming via SSE + Somnia Reactivity SDK (`somnia_watch`)

### Somnia Reactivity Integration

- **On-chain**: 2 handler contracts inheriting `SomniaEventHandler` with `_onEvent` overrides
- **On-chain subscriptions**: 3 chained subscriptions via `sdk.createSoliditySubscription()`
- **Off-chain**: Server uses `sdk.subscribe()` via `somnia_watch` for native push events
- **Fallback**: Automatic fallback to viem `watchContractEvent` if SDK fails

---

## Tech Stack

| Layer           | Stack                                                                                           |
| --------------- | ----------------------------------------------------------------------------------------------- |
| **Frontend**    | React 19, Vite, TypeScript, Tailwind v4, wagmi v2, viem, Zustand, TanStack Query, framer-motion |
| **Server**      | Hono, Vercel AI SDK, viem                                                                       |
| **LLM (local)** | Ollama with Qwen 3 8B (`qwen3:8b`) via ollama-ai-provider-v2                                    |
| **LLM (prod)**  | Groq with Llama 3.1 8B / Llama 3.3 70B via @ai-sdk/groq                                         |
| **Contracts**   | Solidity 0.8.30, Hardhat, OpenZeppelin 5.x, @somnia-chain/reactivity-contracts                  |
| **Reactivity**  | @somnia-chain/reactivity SDK (on-chain + off-chain subscriptions)                               |
| **Design**      | Font: Onest. Primary: #FFD5F0 (pink). Secondary: #1A1A1A (charcoal)                             |

---

## Local Development

```bash
# Install dependencies
pnpm install

# Run frontend (:5173) + server (:3001)
pnpm dev

# Frontend only
pnpm dev:client

# Server only
pnpm dev:server

# Build
pnpm build
```

### Contracts

```bash
cd contracts
pnpm install
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.ts --network somnia_testnet
npx tsx scripts/setup-subscriptions.ts  # Register reactive subscriptions
```

---

## Environment Setup

**Root** (`.env`):

```bash
# Contract addresses
VITE_SIMPLE_DEX=0x...
VITE_LEADER_REGISTRY=0x...
VITE_FOLLOWER_VAULT=0x...
VITE_MIRROR_EXECUTOR=0x...
VITE_POSITION_TRACKER=0x...
VITE_REPUTATION_ENGINE=0x...
VITE_RISK_GUARDIAN=0x...
VITE_STT_TOKEN=0x...
VITE_USDC_TOKEN=0x...
VITE_WETH_TOKEN=0x...
VITE_WC_PROJECT_ID=

# Server LLM config
LLM_PROVIDER=ollama          # or 'groq'
OLLAMA_MODEL=qwen3:8b
OLLAMA_BASE_URL=http://localhost:11434/api
GROQ_API_KEY=
```

**Contracts** (`contracts/.env`):

```bash
PRIVATE_KEY=your_deployer_private_key_here
```

---

## Session Key System

```
1. User clicks "Activate" on /oni -> signs EIP-191 message
2. Server generates ephemeral keypair (private key never leaves server)
3. User transfers ERC-20 STT (trading capital) + native STT (gas)
4. Server auto-approves contracts, executes trades autonomously
5. Session expires after 30 min, spending capped at 50 STT
```

- Server-generated keys (private key never transmitted)
- EIP-191 wallet signature for authentication
- In-memory session store with fixed TTL + spending cap + operation limit
- Unauthenticated revoke endpoint for disconnect cleanup
- Automatic fallback to manual ActionCards when session wallet is low

---

## Contract Cascade

```
SimpleDEX (Swap event)
    |
    v  [Reactive Subscription #1]
MirrorExecutor
    |-- pulls tokens from FollowerVault
    |-- swaps on SimpleDEX proportionally
    |-- updates PositionTracker
    |-- updates ReputationEngine
    |-- emits MirrorExecuted
    |
    v  [Reactive Subscription #2]
RiskGuardian
    |-- checks stop-loss threshold
    |-- emergency closes position if breached

MirrorExecutor (MirrorContinue)
    |
    v  [Reactive Subscription #3]
MirrorExecutor (next batch of followers, paginated)
```

**7 contracts** | **2 reactive handlers** | **3 on-chain subscriptions** | **Somnia Shannon Testnet**

---

## Security

- EIP-191 signature verification on session endpoints
- Server-generated session keys (private key never leaves server)
- `toJSON` guard prevents accidental key leak in logs
- Spending cap (50 STT) + operation limit (50 ops) per session
- Contract address whitelist on all write operations
- CORS restricted to allowed origins
- Rate limiting on all endpoints (IP-based with UA fingerprint fallback)
- Input validation with sanitized error messages
- Session auto-cleanup on wallet disconnect/switch

---
