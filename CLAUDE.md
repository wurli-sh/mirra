# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MirrorX (package name: "anesthesia") is a reactive copy-trading protocol on Somnia Shannon Testnet (Chain ID 50312). Leaders trade on a DEX; followers' vaults automatically mirror those trades via on-chain reactive subscriptions — no bots or off-chain infrastructure.

## Commands

```bash
# Install dependencies
pnpm install

# Compile contracts
npx hardhat compile

# Run all tests
npx hardhat test

# Run a single test file
npx hardhat test contracts/test/SimpleDEX.test.ts

# Deploy (no scripts/ directory yet — needs creation)
npx hardhat run scripts/deploy.ts --network somnia_testnet
```

## Architecture

### Contract System (Solidity 0.8.30, viaIR enabled)

7 contracts with 2 reactive (Somnia Reactivity) and 5 regular:

**Reactive cascade (the core flow):**
1. Leader swaps on **SimpleDEX** → emits `Swap` event
2. **MirrorExecutor** [REACTIVE] reacts to `Swap`, mirrors trade to up to 5 followers via paginated fan-out, calls PositionTracker + ReputationEngine inline
3. **RiskGuardian** [REACTIVE] reacts to `MirrorExecuted`, checks stop-loss thresholds, calls `emergencyClose` if breached

**Regular contracts (called directly, not reactive):**
- **LeaderRegistry** — leader registration with 10 STT minimum stake
- **FollowerVault** — holds follower deposits, manages follow positions, fee accrual, emergency close
- **PositionTracker** — tracks positions and unrealized P&L per follower/leader/token
- **ReputationEngine** — leader stats and composite scoring (60% win rate + 20% volume + 20% recency)

### Dependency Graph

```
SimpleDEX → [reactive] MirrorExecutor → [reactive] RiskGuardian
                           ├── LeaderRegistry (reads)
                           ├── FollowerVault (reads + pulls tokens)
                           ├── PositionTracker (writes)
                           └── ReputationEngine (writes)
```

### Access Control Pattern

- `FollowerVault.pullTokens/accrueFee` → only MirrorExecutor
- `FollowerVault.emergencyClose` → only RiskGuardian
- `PositionTracker` write functions → only MirrorExecutor + RiskGuardian
- `ReputationEngine` write functions → only MirrorExecutor + RiskGuardian

### Key Design Constraints (Somnia Gas Model)

Somnia has drastically different gas costs vs Ethereum:
- Cold SLOAD/CALL: **1,000,000 gas** each (vs 2,100/2,600 on Ethereum)
- `MAX_FOLLOWERS_PER_MIRROR = 5` — MirrorExecutor touches 5 contracts (5M fixed overhead), remaining 5M covers per-follower ops within 10M gasLimit
- Use `bytes32 constant` for event signatures (KECCAK256 is 42x more expensive)
- Paginated `getFollowers(offset, limit)` to avoid memory gas bomb

### Test Structure

Tests live in `contracts/test/` (not the default `test/` directory — configured in hardhat.config.ts `paths.tests`). Integration test `FullCascade.test.ts` covers the complete leader swap → mirror → risk check flow.

### Environment

Requires `.env` with `PRIVATE_KEY` for testnet deployment. See `.env.example`.

### Tech Stack

- **Package manager:** pnpm
- **Contracts:** Hardhat + hardhat-toolbox, OpenZeppelin 5.x, `@somnia-chain/reactivity-contracts`
- **Reactive subscriptions:** `@somnia-chain/reactivity` SDK (TypeScript, uses viem)
- **Frontend (planned):** React 19, Vite, wagmi v2, viem, ConnectKit (never ethers.js), Zustand, TanStack Query
- **Chain:** Somnia Shannon Testnet — RPC `https://dream-rpc.somnia.network/`
