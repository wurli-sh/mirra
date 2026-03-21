// @ts-nocheck — server-only, runs via tsx without type checking
import { tool } from 'ai'
import { z } from 'zod'
import { formatEther, type Address } from 'viem'
import { publicClient, contracts } from '../../lib/viem-client'
import { getLastTradeTimestamp } from '../../lib/reactive-stream'
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

export const get_leaders = tool({
  description: 'Get all registered leaders with their scores, PnL, volume, win rate, and follower counts. Use this when the user asks about top leaders, leaderboard, or who to follow.',
  parameters: z.object({}),
  execute: async () => {
    const count = await publicClient.readContract({
      address: contracts.leaderRegistry,
      abi: LeaderRegistryAbi,
      functionName: 'getLeaderCount',
    })
    const leaderCount = Number(count)
    if (leaderCount === 0) return { leaders: [], count: 0 }

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

    const leaders = await Promise.all(
      addresses.map(async (addr) => {
        const [rawStats, score, followerCount] = await Promise.all([
          publicClient.readContract({
            address: contracts.reputationEngine,
            abi: ReputationEngineAbi,
            functionName: 'getStats',
            args: [addr],
          }),
          publicClient.readContract({
            address: contracts.reputationEngine,
            abi: ReputationEngineAbi,
            functionName: 'getScore',
            args: [addr],
          }),
          publicClient.readContract({
            address: contracts.followerVault,
            abi: FollowerVaultAbi,
            functionName: 'getFollowerCount',
            args: [addr],
          }),
        ])

        const stats = rawStats as unknown as LeaderStats
        const totalTrades = Number(stats.totalTrades)
        const profitableTrades = Number(stats.profitableTrades)
        const totalPnlSTT = Number(formatEther(stats.totalPnlSTT))
        const totalVolumeSTT = Number(formatEther(stats.totalVolumeSTT))
        const winRate = totalTrades > 0 ? Math.round((profitableTrades / totalTrades) * 1000) / 10 : 0

        return {
          address: addr,
          shortAddress: `${addr.slice(0, 6)}...${addr.slice(-4)}`,
          score: Number(score),
          winRate,
          pnl: Math.round(totalPnlSTT * 100) / 100,
          volume: Math.round(totalVolumeSTT * 100) / 100,
          totalTrades,
          followers: Number(followerCount),
        }
      })
    )

    leaders.sort((a, b) => b.score - a.score)
    const lastTs = getLastTradeTimestamp()
    const lastTradeSecondsAgo = lastTs ? Math.round((Date.now() - lastTs) / 1000) : null
    return { leaders, count: leaderCount, lastTradeSecondsAgo }
  },
})

export const get_leader_stats = tool({
  description: 'Get detailed reputation stats for a specific leader address. Accepts full or partial/truncated addresses (e.g. "0xFbc8...E066").',
  parameters: z.object({
    address: z.string().describe('Leader wallet address — full (0x...) or partial (0xFbc8...E066)'),
  }),
  execute: async ({ address }: { address: string }) => {
    let addr = address as Address

    // If address looks truncated, try to resolve from registered leaders
    if (address.includes('...') || address.length < 42) {
      const prefix = address.slice(0, 6).toLowerCase()
      const suffix = address.slice(-4).toLowerCase()
      const count = await publicClient.readContract({
        address: contracts.leaderRegistry,
        abi: LeaderRegistryAbi,
        functionName: 'getLeaderCount',
      })
      for (let i = 0; i < Number(count); i++) {
        const candidate = await publicClient.readContract({
          address: contracts.leaderRegistry,
          abi: LeaderRegistryAbi,
          functionName: 'getLeaderAt',
          args: [BigInt(i)],
        })
        if (candidate.toLowerCase().startsWith(prefix) && candidate.toLowerCase().endsWith(suffix)) {
          addr = candidate
          break
        }
      }
      if (addr === address as Address) {
        return { error: `Could not find a registered leader matching "${address}". Use get_leaders to see all leaders.` }
      }
    }
    const [rawStats, score, followerCount] = await Promise.all([
      publicClient.readContract({
        address: contracts.reputationEngine,
        abi: ReputationEngineAbi,
        functionName: 'getStats',
        args: [addr],
      }),
      publicClient.readContract({
        address: contracts.reputationEngine,
        abi: ReputationEngineAbi,
        functionName: 'getScore',
        args: [addr],
      }),
      publicClient.readContract({
        address: contracts.followerVault,
        abi: FollowerVaultAbi,
        functionName: 'getFollowerCount',
        args: [addr],
      }),
    ])

    const stats = rawStats as unknown as LeaderStats
    const totalTrades = Number(stats.totalTrades)
    const profitableTrades = Number(stats.profitableTrades)
    const winRate = totalTrades > 0 ? Math.round((profitableTrades / totalTrades) * 1000) / 10 : 0

    return {
      address: addr,
      score: Number(score),
      totalTrades,
      profitableTrades,
      winRate,
      pnl: Math.round(Number(formatEther(stats.totalPnlSTT)) * 100) / 100,
      volume: Math.round(Number(formatEther(stats.totalVolumeSTT)) * 100) / 100,
      followers: Number(followerCount),
    }
  },
})

export const is_leader = tool({
  description: 'Check if a given address is a registered leader.',
  parameters: z.object({
    address: z.string().describe('Wallet address to check'),
  }),
  execute: async ({ address }: { address: string }) => {
    const result = await publicClient.readContract({
      address: contracts.leaderRegistry,
      abi: LeaderRegistryAbi,
      functionName: 'isLeader',
      args: [address as Address],
    })
    return { address, isLeader: result }
  },
})
