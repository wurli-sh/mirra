import { useReadContract, useReadContracts } from 'wagmi'
import { formatEther } from 'viem'
import { contracts } from '@/config/contracts'
import { LeaderRegistryAbi } from '@/config/abi/LeaderRegistry'
import { ReputationEngineAbi } from '@/config/abi/ReputationEngine'
import { FollowerVaultAbi } from '@/config/abi/FollowerVault'
import type { Leader } from '@/data/types'

const POLL_INTERVAL = 5_000

export function useLeaderCount() {
  return useReadContract({
    address: contracts.leaderRegistry,
    abi: LeaderRegistryAbi,
    functionName: 'getLeaderCount',
    query: { refetchInterval: POLL_INTERVAL },
  })
}

export function useLeaders() {
  const { data: count, isLoading: countLoading } = useLeaderCount()
  const leaderCount = count ? Number(count) : 0

  // Get all leader addresses
  const addressCalls = Array.from({ length: leaderCount }, (_, i) => ({
    address: contracts.leaderRegistry as `0x${string}`,
    abi: LeaderRegistryAbi,
    functionName: 'getLeaderAt' as const,
    args: [BigInt(i)] as const,
  }))

  const { data: addressResults, isLoading: addressesLoading } = useReadContracts({
    contracts: addressCalls,
    query: { enabled: leaderCount > 0, refetchInterval: POLL_INTERVAL },
  })

  const addresses = addressResults
    ?.filter((r) => r.status === 'success')
    ?.map((r) => r.result as `0x${string}`) ?? []

  // Get stats for each leader
  const statsCalls = addresses.map((addr) => ({
    address: contracts.reputationEngine as `0x${string}`,
    abi: ReputationEngineAbi,
    functionName: 'getStats' as const,
    args: [addr] as const,
  }))

  const scoreCalls = addresses.map((addr) => ({
    address: contracts.reputationEngine as `0x${string}`,
    abi: ReputationEngineAbi,
    functionName: 'getScore' as const,
    args: [addr] as const,
  }))

  const followerCountCalls = addresses.map((addr) => ({
    address: contracts.followerVault as `0x${string}`,
    abi: FollowerVaultAbi,
    functionName: 'getFollowerCount' as const,
    args: [addr] as const,
  }))

  const { data: statsResults, isLoading: statsLoading } = useReadContracts({
    contracts: statsCalls,
    query: { enabled: addresses.length > 0, refetchInterval: POLL_INTERVAL },
  })

  const { data: scoreResults, isLoading: scoresLoading } = useReadContracts({
    contracts: scoreCalls,
    query: { enabled: addresses.length > 0, refetchInterval: POLL_INTERVAL },
  })

  const { data: followerResults, isLoading: followersLoading } = useReadContracts({
    contracts: followerCountCalls,
    query: { enabled: addresses.length > 0, refetchInterval: POLL_INTERVAL },
  })

  const isLoading = countLoading || addressesLoading || statsLoading || scoresLoading || followersLoading

  // Build leader objects from on-chain data
  const leaders: Leader[] = addresses.length > 0
    ? addresses.map((addr, i) => {
        const stats = statsResults?.[i]
        const score = scoreResults?.[i]
        const followers = followerResults?.[i]

        // Parse stats struct: { totalTrades, profitableTrades, totalPnlSTT, totalVolumeSTT, score, lastTradeBlock }
        const statsRaw = stats?.status === 'success'
          ? stats.result as unknown as { totalTrades: bigint; profitableTrades: bigint; totalPnlSTT: bigint; totalVolumeSTT: bigint; score: bigint; lastTradeBlock: bigint }
          : undefined

        const totalTrades = statsRaw ? Number(statsRaw.totalTrades) : 0
        const profitableTrades = statsRaw ? Number(statsRaw.profitableTrades) : 0
        const totalPnlSTT = statsRaw ? Number(formatEther(statsRaw.totalPnlSTT)) : 0
        const totalVolumeSTT = statsRaw ? Number(formatEther(statsRaw.totalVolumeSTT)) : 0
        const leaderScore = score?.status === 'success' ? Number(score.result) : 0
        const followerCount = followers?.status === 'success' ? Number(followers.result) : 0
        const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0

        const truncatedAddr = `${addr.slice(0, 6)}...${addr.slice(-4)}`

        return {
          rank: i + 1,
          address: truncatedAddr,
          fullAddress: addr,
          score: leaderScore,
          winRate: Math.round(winRate * 10) / 10,
          pnl: Math.round(totalPnlSTT * 100) / 100,
          volume: Math.round(totalVolumeSTT * 100) / 100,
          followers: followerCount,
          trend: Array.from({ length: 7 }, (_, j) => {
            // Deterministic trend from address bytes — stable across re-renders
            const byte = parseInt(addr.slice(2 + (j * 2), 4 + (j * 2)), 16)
            return (byte % 16) + 2
          }),
        }
      })
      // Sort by score descending, reassign ranks
      .sort((a, b) => b.score - a.score)
      .map((leader, i) => ({ ...leader, rank: i + 1 }))
    : []

  return { leaders, leaderCount, isLoading }
}
