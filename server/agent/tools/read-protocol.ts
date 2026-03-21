// @ts-nocheck — server-only, runs via tsx without type checking
import { tool } from 'ai'
import { z } from 'zod'
import { formatEther, type Address } from 'viem'
import { publicClient, contracts } from '../../lib/viem-client'
import { getRecentEvents } from '../../lib/reactive-stream'
import { LeaderRegistryAbi } from '../../../src/config/abi/LeaderRegistry'
import { ReputationEngineAbi } from '../../../src/config/abi/ReputationEngine'
import { FollowerVaultAbi } from '../../../src/config/abi/FollowerVault'

type LeaderStats = {
  totalTrades: bigint
  profitableTrades: bigint
  totalPnlSTT: bigint
  totalVolumeSTT: bigint
  score: bigint
  lastTradeBlock: bigint
}

export const get_protocol_stats = tool({
  description: 'Get aggregate protocol statistics: total leaders, total followers, and total trading volume. Use when user asks about protocol health or overall stats.',
  parameters: z.object({}),
  execute: async () => {
    const count = await publicClient.readContract({
      address: contracts.leaderRegistry,
      abi: LeaderRegistryAbi,
      functionName: 'getLeaderCount',
    })
    const leaderCount = Number(count)
    if (leaderCount === 0) return { leaders: 0, followers: 0, volume: '$0' }

    const addresses: Address[] = []
    for (let i = 0; i < leaderCount; i++) {
      const addr = await publicClient.readContract({
        address: contracts.leaderRegistry,
        abi: LeaderRegistryAbi,
        functionName: 'getLeaderAt',
        args: [BigInt(i)],
      })
      addresses.push(addr)
    }

    let totalFollowers = 0
    let totalVolume = 0

    await Promise.all(
      addresses.map(async (addr) => {
        const [fc, rawStats] = await Promise.all([
          publicClient.readContract({
            address: contracts.followerVault,
            abi: FollowerVaultAbi,
            functionName: 'getFollowerCount',
            args: [addr],
          }),
          publicClient.readContract({
            address: contracts.reputationEngine,
            abi: ReputationEngineAbi,
            functionName: 'getStats',
            args: [addr],
          }),
        ])
        const stats = rawStats as unknown as LeaderStats
        totalFollowers += Number(fc)
        totalVolume += Number(formatEther(stats.totalVolumeSTT))
      })
    )

    const formatVolume = (vol: number): string => {
      if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`
      if (vol >= 1_000) return `$${(vol / 1_000).toFixed(1)}K`
      return `$${vol.toFixed(0)}`
    }

    const recentEvents = getRecentEvents(10)
    const recentTradeCount = recentEvents.filter(e => e.type === 'swap').length

    return {
      leaders: leaderCount,
      followers: totalFollowers,
      volume: formatVolume(totalVolume),
      recentTradeCount,
      source: 'rpc+somnia-reactivity',
    }
  },
})
