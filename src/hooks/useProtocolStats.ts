import { useReadContract, useReadContracts } from 'wagmi'
import { formatEther } from 'viem'
import { contracts } from '@/config/contracts'
import { LeaderRegistryAbi } from '@/config/abi/LeaderRegistry'
import { ReputationEngineAbi } from '@/config/abi/ReputationEngine'
import { FollowerVaultAbi } from '@/config/abi/FollowerVault'

export function useProtocolStats() {
  const { data: leaderCount, isLoading: countLoading } = useReadContract({
    address: contracts.leaderRegistry,
    abi: LeaderRegistryAbi,
    functionName: 'getLeaderCount',
  })

  const totalLeaders = leaderCount ? Number(leaderCount) : 0

  // Get all leader addresses for follower count + volume aggregation
  const addressCalls = Array.from({ length: totalLeaders }, (_, i) => ({
    address: contracts.leaderRegistry as `0x${string}`,
    abi: LeaderRegistryAbi,
    functionName: 'getLeaderAt' as const,
    args: [BigInt(i)] as const,
  }))

  const { data: addressResults } = useReadContracts({
    contracts: addressCalls,
    query: { enabled: totalLeaders > 0 },
  })

  const addresses = addressResults
    ?.filter((r) => r.status === 'success')
    ?.map((r) => r.result as `0x${string}`) ?? []

  // Get follower counts for each leader
  const followerCountCalls = addresses.map((addr) => ({
    address: contracts.followerVault as `0x${string}`,
    abi: FollowerVaultAbi,
    functionName: 'getFollowerCount' as const,
    args: [addr] as const,
  }))

  // Get stats (volume) for each leader
  const statsCalls = addresses.map((addr) => ({
    address: contracts.reputationEngine as `0x${string}`,
    abi: ReputationEngineAbi,
    functionName: 'getStats' as const,
    args: [addr] as const,
  }))

  const { data: followerResults } = useReadContracts({
    contracts: followerCountCalls,
    query: { enabled: addresses.length > 0 },
  })

  const { data: statsResults } = useReadContracts({
    contracts: statsCalls,
    query: { enabled: addresses.length > 0 },
  })

  // Aggregate totals
  const totalFollowers = followerResults?.reduce((sum, r) => {
    return sum + (r.status === 'success' ? Number(r.result) : 0)
  }, 0) ?? 0

  const totalVolume = statsResults?.reduce((sum, r) => {
    if (r.status !== 'success') return sum
    const stats = r.result as unknown as readonly bigint[]
    if (!Array.isArray(stats) || stats.length < 4 || stats[3] == null) return sum
    return sum + Number(formatEther(stats[3]))
  }, 0) ?? 0

  const formatVolume = (vol: number): string => {
    if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`
    if (vol >= 1_000) return `$${(vol / 1_000).toFixed(1)}K`
    return `$${vol.toFixed(0)}`
  }

  return {
    stats: {
      leaders: totalLeaders,
      followers: totalFollowers,
      volume: formatVolume(totalVolume),
    },
    isLoading: countLoading,
  }
}
