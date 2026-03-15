import { useReadContract, useReadContracts } from 'wagmi'
import { formatEther } from 'viem'
import { contracts } from '../config/contracts'
import { LeaderRegistryAbi } from '../config/abi/LeaderRegistry'
import { ReputationEngineAbi } from '../config/abi/ReputationEngine'
import { FollowerVaultAbi } from '../config/abi/FollowerVault'
import { type Leader, leaders as mockLeaders } from '../data/mock'

export function useLeaderCount() {
  return useReadContract({
    address: contracts.leaderRegistry,
    abi: LeaderRegistryAbi,
    functionName: 'getLeaderCount',
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
    query: { enabled: leaderCount > 0 },
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
    query: { enabled: addresses.length > 0 },
  })

  const { data: scoreResults, isLoading: scoresLoading } = useReadContracts({
    contracts: scoreCalls,
    query: { enabled: addresses.length > 0 },
  })

  const { data: followerResults, isLoading: followersLoading } = useReadContracts({
    contracts: followerCountCalls,
    query: { enabled: addresses.length > 0 },
  })

  const isLoading = countLoading || addressesLoading || statsLoading || scoresLoading || followersLoading

  // Build leader objects
  const leaders: Leader[] = addresses.length > 0
    ? addresses.map((addr, i) => {
        const stats = statsResults?.[i]
        const score = scoreResults?.[i]
        const followers = followerResults?.[i]

        // Parse stats tuple: totalTrades, profitableTrades, totalPnlSTT, totalVolumeSTT, score, lastTradeBlock
        const statsData = stats?.status === 'success'
          ? stats.result as unknown as readonly [bigint, bigint, bigint, bigint, bigint, bigint]
          : undefined

        const totalTrades = statsData ? Number(statsData[0]) : 0
        const profitableTrades = statsData ? Number(statsData[1]) : 0
        const totalPnlSTT = statsData ? Number(formatEther(statsData[2])) : 0
        const totalVolumeSTT = statsData ? Number(formatEther(statsData[3])) : 0
        const leaderScore = score?.status === 'success' ? Number(score.result) : 0
        const followerCount = followers?.status === 'success' ? Number(followers.result) : 0
        const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0

        const truncatedAddr = `${addr.slice(0, 6)}...${addr.slice(-4)}`

        return {
          rank: i + 1,
          address: truncatedAddr,
          score: leaderScore,
          winRate: Math.round(winRate * 10) / 10,
          pnl: Math.round(totalPnlSTT * 100) / 100,
          volume: Math.round(totalVolumeSTT * 100) / 100,
          followers: followerCount,
          form: Array.from({ length: 5 }, (_, j) => j < profitableTrades % 5),
          trend: Array.from({ length: 7 }, () => Math.floor(Math.random() * 16) + 2),
        }
      })
      // Sort by score descending, reassign ranks
      .sort((a, b) => b.score - a.score)
      .map((leader, i) => ({ ...leader, rank: i + 1 }))
    : mockLeaders

  return { leaders, leaderCount, isLoading }
}
