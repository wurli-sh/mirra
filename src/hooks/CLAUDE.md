# src/hooks/CLAUDE.md

## Overview

Custom hooks wrapping wagmi's `useReadContract` / `useReadContracts` / `useWriteContract` for each contract interaction. All hooks use viem types and ABI JSON from `config/abi/`.

**Important:** Multicall3 is NOT deployed on Somnia testnet. wagmi config has `batch: { multicall: false }` so `useReadContracts` sends individual RPC calls instead of batching.

## Hook Inventory

| Hook | Type | Contract | Purpose |
|------|------|----------|---------|
| `useSwap` | write | SimpleDEX | Execute token swaps |
| `useAmountOut` | read | SimpleDEX | Get estimated swap output |
| `useReserves` | read | SimpleDEX | Get pool liquidity reserves |
| `useRegisterLeader` | write | LeaderRegistry | Register as leader with STT stake |
| `useDeregisterLeader` | write | LeaderRegistry | Deregister as leader |
| `useIsLeader` | read | LeaderRegistry | Check if connected user is a leader |
| `useMinStake` | read | LeaderRegistry | Get minimum leader stake amount |
| `useFollow` | write | FollowerVault | Follow a leader with deposit |
| `useUnfollow` | write | FollowerVault | Unfollow a leader |
| `useDepositMore` | write | FollowerVault | Add to existing follow position |
| `useWithdrawPosition` | write | FollowerVault | Withdraw from position |
| `useClaimFees` | write | FollowerVault | Claim accrued fees |
| `usePendingFees` | read | FollowerVault | Read pending fee amount |
| `useApproveToken` | write | ERC20 | Token approval for contracts |
| `useLeaders` | read | LeaderRegistry + ReputationEngine + FollowerVault | Fetch all leaders with scores, PnL, followers |
| `useLeaderStats` | read | ReputationEngine | Connected user's leader reputation |
| `usePositions` | read | FollowerVault + PositionTracker + ReputationEngine | Follower positions and P&L |
| `useProtocolStats` | read | Multiple | Aggregate protocol metrics |
| `useLiveEvents` | read | Multiple | Watch for on-chain events (localStorage persist) |
| `useReactiveEvents` | util | — | SSE consumer for Somnia Reactivity event stream |
| `useWallet` | util | — | Wallet connection state wrapper |
| `usePageReady` | util | — | Page load readiness flag |
| `useSessionBalance` | read | ERC20 + native | Session wallet STT + gas balance, auto-verifies server session status |
| `useSessionCleanup` | util | — | Auto-revokes session on wallet disconnect or address change |

## Chat Agent Reuse

The server-side agent tools (`server/agent/tools/`) replicate the read logic from these hooks using viem's `publicClient.readContract()` directly. When updating read hooks, keep the server tool equivalents in sync:

| Frontend Hook | Server Tool |
|---------------|-------------|
| `useLeaders` | `get_leaders` |
| `useProtocolStats` | `get_protocol_stats` |
| `usePositions` | `get_user_positions` |
| `useAmountOut` | `get_amount_out` |
| `useReserves` | `get_reserves` |
| `useReactiveEvents` (SSE) | `get_recent_trades` (ring buffer) |

Note: `get_recent_trades` reads from the viem WebSocket event watcher cache — the frontend consumes the same data via SSE (`GET /api/events`).

The `ActionCard` component in `components/chat/` dispatches write actions via `useWriteContract` with matching ABI calls.

## Conventions

- Contract addresses from `config/contracts.ts` (env vars)
- ABIs from `config/abi/*.ts` — imported as typed `const` arrays
- Use viem's `Address` type for addresses, never raw strings
- Write hooks return `{ write/swap/follow/etc, hash, isPending, isConfirming, isSuccess, error }` pattern
- Read hooks use TanStack Query caching via wagmi (staleTime: 10s, refetchInterval: 5s for live data)
- Position struct returned by `FollowerVault.getPosition()` uses named fields (not tuple indices)
- Leader stats struct returned by `ReputationEngine.getStats()` uses named fields (not tuple indices)
