# src/hooks/CLAUDE.md

## Overview

Custom hooks wrapping wagmi's `useReadContract` / `useWriteContract` for each contract interaction. All hooks use viem types and ABI JSON from `config/abi/`.

## Hook Inventory

| Hook | Type | Contract | Purpose |
|------|------|----------|---------|
| `useSwap` | write | SimpleDEX | Execute token swaps |
| `useRegisterLeader` | write | LeaderRegistry | Register as leader with STT stake |
| `useFollow` | write | FollowerVault | Follow a leader with deposit |
| `useUnfollow` | write | FollowerVault | Unfollow a leader |
| `useDepositMore` | write | FollowerVault | Add to existing follow position |
| `useWithdrawPosition` | write | FollowerVault | Withdraw from position |
| `useClaimFees` | write | FollowerVault | Claim accrued fees |
| `useApproveToken` | write | ERC20 | Token approval for contracts |
| `useLeaders` | read | LeaderRegistry | Fetch registered leaders list |
| `useLeaderStats` | read | ReputationEngine | Leader reputation scores |
| `usePositions` | read | PositionTracker | Follower positions and P&L |
| `useProtocolStats` | read | Multiple | Aggregate protocol metrics |
| `useLiveEvents` | read | Multiple | Watch for on-chain events |
| `useWallet` | util | — | Wallet connection state wrapper |
| `usePageReady` | util | — | Page load readiness flag |

## Conventions

- Contract addresses from `config/contracts.ts` (env vars)
- ABIs from `config/abi/*.json` — imported as typed JSON
- Use viem's `Address` type for addresses, never raw strings
- Write hooks return `{ write, isPending, isSuccess, error }` pattern
- Read hooks use TanStack Query caching via wagmi (staleTime: 10s)
- Event decoding uses viem struct decoding — watch for tuple return types
