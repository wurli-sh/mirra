# CLAUDE.md

## Project

Mirra — reactive copy-trading protocol on Somnia Shannon Testnet (Chain ID 50312). Leaders trade on SimpleDEX; followers' vaults mirror trades automatically via on-chain reactive subscriptions.

## Structure

```
contracts/               # Solidity 0.8.30, Hardhat, tests → contracts/CLAUDE.md
src/                     # React 19 + Vite frontend → src/CLAUDE.md
  components/            # Domain-grouped UI → src/components/CLAUDE.md
  hooks/                 # wagmi contract hooks → src/hooks/CLAUDE.md
  config/                # Chain, addresses (env), wagmi, ABIs
  stores/                # Zustand (ui.ts)
  lib/                   # cn, format, animations
  pages/                 # HomePage, LeaderboardPage, TradePage
  data/                  # Shared types
```

## Commands

```bash
pnpm install             # deps
pnpm dev                 # frontend dev → :5173
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

- **Frontend:** React 19, Vite, wagmi v2, viem (never ethers.js), Zustand, TanStack Query, Tailwind v4, framer-motion, lucide-react
- **Contracts:** Hardhat, OpenZeppelin 5.x, `@somnia-chain/reactivity-contracts`
- **Design:** Font: Onest. Primary: #FFD5F0 (pink). Secondary: #1A1A1A (charcoal). Tokens in `src/app.css` `@theme`
- **Path alias:** `@` → `src/`

## Somnia Gas Constraints

Cold SLOAD/CALL: 1M gas each. MAX_FOLLOWERS_PER_MIRROR = 5. Use `bytes32 constant` for event sigs. Paginated `getFollowers(offset, limit)`.

## Env

Frontend: `VITE_*` contract addresses + `VITE_WC_PROJECT_ID`. Contracts: `PRIVATE_KEY` for deploy.

## Subdirectory Guides

- [contracts/CLAUDE.md](contracts/CLAUDE.md)
- [src/CLAUDE.md](src/CLAUDE.md)
- [src/components/CLAUDE.md](src/components/CLAUDE.md)
- [src/hooks/CLAUDE.md](src/hooks/CLAUDE.md)
