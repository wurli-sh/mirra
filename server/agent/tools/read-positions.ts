// @ts-nocheck — server-only, runs via tsx without type checking
import { tool } from 'ai'
import { z } from 'zod'
import { formatEther, type Address } from 'viem'
import { publicClient, contracts } from '../../lib/viem-client'
import { LeaderRegistryAbi } from '../../../src/config/abi/LeaderRegistry'
import { FollowerVaultAbi } from '../../../src/config/abi/FollowerVault'
import { PositionTrackerAbi } from '../../../src/config/abi/PositionTracker'
import { ReputationEngineAbi } from '../../../src/config/abi/ReputationEngine'

export function makeGetUserPositions(userAddress?: string) {
  return tool({
    description: 'Get the connected user\'s active follow positions across all leaders. Shows deposited amount, PnL, stop loss, and leader scores.',
    parameters: z.object({}),
    execute: async () => {
      if (!userAddress) return { error: 'No wallet connected. Ask the user to connect their wallet first.' }

      const addr = userAddress as Address
      const count = await publicClient.readContract({
        address: contracts.leaderRegistry,
        abi: LeaderRegistryAbi,
        functionName: 'getLeaderCount',
      })
      const leaderCount = Number(count)
      if (leaderCount === 0) return { positions: [] }

      const leaderAddresses: Address[] = []
      for (let i = 0; i < leaderCount; i++) {
        const a = await publicClient.readContract({
          address: contracts.leaderRegistry,
          abi: LeaderRegistryAbi,
          functionName: 'getLeaderAt',
          args: [BigInt(i)],
        })
        leaderAddresses.push(a)
      }

      const positions = await Promise.all(
        leaderAddresses.map(async (leader) => {
          const [pos, pnl, score] = await Promise.all([
            publicClient.readContract({
              address: contracts.followerVault,
              abi: FollowerVaultAbi,
              functionName: 'getPosition',
              args: [addr, leader],
            }),
            publicClient.readContract({
              address: contracts.positionTracker,
              abi: PositionTrackerAbi,
              functionName: 'getUnrealizedPnl',
              args: [addr, leader],
            }),
            publicClient.readContract({
              address: contracts.reputationEngine,
              abi: ReputationEngineAbi,
              functionName: 'getScore',
              args: [leader],
            }),
          ])

          const p = pos as unknown as {
            follower: Address; leader: Address; depositedSTT: bigint;
            maxPerTrade: bigint; maxSlippageBps: number; stopLossSTT: bigint; active: boolean;
          }
          if (!p.active) return null

          const deposited = Number(formatEther(p.depositedSTT))
          const pnlValue = Number(formatEther(pnl as bigint))
          const pnlPercent = deposited > 0 ? (pnlValue / deposited) * 100 : 0

          return {
            leader,
            shortLeader: `${leader.slice(0, 6)}...${leader.slice(-4)}`,
            score: Number(score),
            deposited: Math.round(deposited * 100) / 100,
            maxPerTrade: Math.round(Number(formatEther(p.maxPerTrade)) * 100) / 100,
            slippageBps: Number(p.maxSlippageBps),
            stopLoss: Math.round(Number(formatEther(p.stopLossSTT)) * 100) / 100,
            pnl: Math.round(pnlValue * 100) / 100,
            pnlPercent: Math.round(pnlPercent * 10) / 10,
          }
        })
      )

      return { positions: positions.filter(Boolean) }
    },
  })
}
