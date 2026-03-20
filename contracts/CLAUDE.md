# contracts/CLAUDE.md

## Overview

Hardhat project with 7 Solidity 0.8.30 contracts (viaIR enabled, optimizer 200 runs). Uses OpenZeppelin 5.x and `@somnia-chain/reactivity-contracts`.

## Directory Layout

```
contracts/
├── src/                  # Solidity sources
│   ├── SimpleDEX.sol
│   ├── MirrorExecutor.sol    [REACTIVE]
│   ├── RiskGuardian.sol      [REACTIVE]
│   ├── LeaderRegistry.sol
│   ├── FollowerVault.sol
│   ├── PositionTracker.sol
│   ├── ReputationEngine.sol
│   ├── interfaces/           # Contract interfaces
│   └── mocks/                # Test mocks
├── test/                 # Hardhat tests (TypeScript)
├── scripts/              # deploy.ts, seed.ts, setup-subscriptions.ts
├── artifacts/            # Compiled output (gitignored)
├── typechain-types/      # Generated TypeScript bindings
└── hardhat.config.ts
```

## Important: Non-default Paths

Hardhat config overrides default paths:
- **Sources:** `./src` (not `./contracts`)
- **Tests:** `./test` (not `./test` at repo root)

Run commands from the `contracts/` directory.

## Access Control

- `FollowerVault.pullTokens/accrueFee` → only MirrorExecutor
- `FollowerVault.emergencyClose` → only RiskGuardian
- `PositionTracker` writes → only MirrorExecutor + RiskGuardian
- `ReputationEngine` writes → only MirrorExecutor + RiskGuardian

## Testing

- Unit tests per contract: `{ContractName}.test.ts`
- Integration test: `FullCascade.test.ts` — full leader swap → mirror → risk check flow
- Run: `npx hardhat test` from this directory

## Deployment

Scripts in `scripts/`:
1. `deploy.ts` — deploys all contracts
2. `seed.ts` — seeds test data (leaders, followers, swaps)
3. `setup-subscriptions.ts` — registers reactive subscriptions on Somnia

Network: `somnia_testnet` (chain 50312, RPC `https://dream-rpc.somnia.network/`)
