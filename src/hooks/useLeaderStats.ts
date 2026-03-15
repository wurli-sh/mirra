import { useAccount, useReadContract } from 'wagmi'
import { formatEther } from 'viem'
import { contracts } from '@/config/contracts'
import { ReputationEngineAbi } from '@/config/abi/ReputationEngine'
import { FollowerVaultAbi } from '@/config/abi/FollowerVault'

export function useLeaderStats() {
  const { address } = useAccount()

  const { data: statsData, isLoading: statsLoading } = useReadContract({
    address: contracts.reputationEngine,
    abi: ReputationEngineAbi,
    functionName: 'getStats',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const { data: scoreData, isLoading: scoreLoading } = useReadContract({
    address: contracts.reputationEngine,
    abi: ReputationEngineAbi,
    functionName: 'getScore',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const { data: followerCount, isLoading: followersLoading } = useReadContract({
    address: contracts.followerVault,
    abi: FollowerVaultAbi,
    functionName: 'getFollowerCount',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const isLoading = statsLoading || scoreLoading || followersLoading

  // Parse stats tuple: totalTrades, profitableTrades, totalPnlSTT, totalVolumeSTT, score, lastTradeBlock
  const stats = statsData as unknown as readonly bigint[] | undefined
  const hasStats = Array.isArray(stats) && stats.length >= 3 && stats[2] != null

  const totalTrades = hasStats ? Number(stats[0]) : 0
  const profitableTrades = hasStats ? Number(stats[1]) : 0
  const totalPnl = hasStats ? Number(formatEther(stats[2])) : 0
  const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0
  const score = scoreData ? Number(scoreData) : 0
  const followers = followerCount ? Number(followerCount) : 0

  return {
    score: Math.round(score * 10) / 10,
    winRate: Math.round(winRate * 10) / 10,
    trades: totalTrades,
    pnl: Math.round(totalPnl * 100) / 100,
    followers,
    isLoading,
  }
}
