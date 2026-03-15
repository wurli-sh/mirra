import { useAccount, useReadContracts } from 'wagmi'
import { formatEther } from 'viem'
import { contracts } from '@/config/contracts'
import { LeaderRegistryAbi } from '@/config/abi/LeaderRegistry'
import { FollowerVaultAbi } from '@/config/abi/FollowerVault'
import { PositionTrackerAbi } from '@/config/abi/PositionTracker'
import { ReputationEngineAbi } from '@/config/abi/ReputationEngine'
import type { Position } from '@/data/types'

export function usePositions() {
  const { address } = useAccount()

  const { data: countResult } = useReadContracts({
    contracts: [{
      address: contracts.leaderRegistry as `0x${string}`,
      abi: LeaderRegistryAbi,
      functionName: 'getLeaderCount',
    }],
    query: { enabled: !!address },
  })

  const leaderCount = countResult?.[0]?.status === 'success' ? Number(countResult[0].result) : 0

  const leaderAddressCalls = Array.from({ length: leaderCount }, (_, i) => ({
    address: contracts.leaderRegistry as `0x${string}`,
    abi: LeaderRegistryAbi,
    functionName: 'getLeaderAt' as const,
    args: [BigInt(i)] as const,
  }))

  const { data: leaderAddresses } = useReadContracts({
    contracts: leaderAddressCalls,
    query: { enabled: leaderCount > 0 && !!address },
  })

  const fullAddresses = leaderAddresses
    ?.filter((r) => r.status === 'success')
    ?.map((r) => r.result as `0x${string}`) ?? []

  // Read positions for connected wallet vs each leader
  const positionCalls = fullAddresses.map((leaderAddr) => ({
    address: contracts.followerVault as `0x${string}`,
    abi: FollowerVaultAbi,
    functionName: 'getPosition' as const,
    args: [address!, leaderAddr] as const,
  }))

  const pnlCalls = fullAddresses.map((leaderAddr) => ({
    address: contracts.positionTracker as `0x${string}`,
    abi: PositionTrackerAbi,
    functionName: 'getUnrealizedPnl' as const,
    args: [address!, leaderAddr] as const,
  }))

  const scoreCalls = fullAddresses.map((leaderAddr) => ({
    address: contracts.reputationEngine as `0x${string}`,
    abi: ReputationEngineAbi,
    functionName: 'getScore' as const,
    args: [leaderAddr] as const,
  }))

  const { data: positionResults, isLoading: positionsLoading } = useReadContracts({
    contracts: positionCalls,
    query: { enabled: fullAddresses.length > 0 && !!address },
  })

  const { data: pnlResults, isLoading: pnlLoading } = useReadContracts({
    contracts: pnlCalls,
    query: { enabled: fullAddresses.length > 0 && !!address },
  })

  const { data: scoreResults, isLoading: scoresLoading } = useReadContracts({
    contracts: scoreCalls,
    query: { enabled: fullAddresses.length > 0 && !!address },
  })

  const isLoading = positionsLoading || pnlLoading || scoresLoading

  // Build active positions from on-chain data only
  const positions: Position[] = (() => {
    if (!address || fullAddresses.length === 0 || !positionResults) return []

    const activePositions: Position[] = []

    fullAddresses.forEach((leaderAddr, i) => {
      const posResult = positionResults[i]
      if (posResult?.status !== 'success') return

      // FollowPosition tuple: follower, leader, depositedSTT, maxPerTrade, maxSlippageBps, stopLossSTT, active
      const pos = posResult.result as unknown as readonly [
        `0x${string}`, `0x${string}`, bigint, bigint, bigint, bigint, boolean
      ]
      if (!pos || !pos[6]) return // not active

      const deposited = Number(formatEther(pos[2]))
      const maxPerTrade = Number(formatEther(pos[3]))
      const slippage = Number(pos[4]) / 100 // bps to percent
      const stopLoss = Number(formatEther(pos[5]))

      const pnlRaw = pnlResults?.[i]?.status === 'success'
        ? Number(formatEther(pnlResults[i].result as bigint))
        : 0

      const score = scoreResults?.[i]?.status === 'success'
        ? Number(scoreResults[i].result)
        : 0

      const pnlPercent = deposited > 0 ? (pnlRaw / deposited) * 100 : 0
      const stopLossUsed = stopLoss > 0 ? Math.min(100, Math.abs(pnlRaw) / stopLoss * 100) : 0
      const truncatedAddr = `${leaderAddr.slice(0, 6)}...${leaderAddr.slice(-4)}`

      activePositions.push({
        leader: truncatedAddr,
        fullLeaderAddress: leaderAddr,
        score,
        rank: i + 1,
        deposited: Math.round(deposited * 100) / 100,
        token: 'STT',
        maxPerTrade: Math.round(maxPerTrade * 100) / 100,
        slippage: Math.round(slippage * 10) / 10,
        stopLoss: Math.round(stopLoss * 100) / 100,
        pnl: Math.round(pnlRaw * 100) / 100,
        pnlPercent: Math.round(pnlPercent * 10) / 10,
        stopLossUsed: Math.round(stopLossUsed),
      })
    })

    return activePositions
  })()

  return { positions, isLoading }
}
