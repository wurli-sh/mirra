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
    query: { enabled: !!address, refetchInterval: 5_000 },
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
    query: { enabled: leaderCount > 0 && !!address, refetchInterval: 5_000 },
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
    query: { enabled: fullAddresses.length > 0 && !!address, refetchInterval: 5_000 },
  })

  const { data: pnlResults, isLoading: pnlLoading } = useReadContracts({
    contracts: pnlCalls,
    query: { enabled: fullAddresses.length > 0 && !!address, refetchInterval: 5_000 },
  })

  const { data: scoreResults, isLoading: scoresLoading } = useReadContracts({
    contracts: scoreCalls,
    query: { enabled: fullAddresses.length > 0 && !!address, refetchInterval: 5_000 },
  })

  const isLoading = positionsLoading || pnlLoading || scoresLoading

  // Build active positions from on-chain data only
  const positions: Position[] = (() => {
    if (!address || fullAddresses.length === 0 || !positionResults) return []

    const activePositions: Position[] = []

    fullAddresses.forEach((leaderAddr, i) => {
      const posResult = positionResults[i]
      if (posResult?.status !== 'success') return

      // FollowPosition struct: { follower, leader, depositedSTT, maxPerTrade, maxSlippageBps, stopLossSTT, active }
      const pos = posResult.result as unknown as {
        follower: `0x${string}`; leader: `0x${string}`; depositedSTT: bigint;
        maxPerTrade: bigint; maxSlippageBps: number; stopLossSTT: bigint; active: boolean;
      }
      if (!pos || !pos.active) return // not active

      const deposited = Number(formatEther(pos.depositedSTT))
      const maxPerTrade = Number(formatEther(pos.maxPerTrade))
      const slippage = Number(pos.maxSlippageBps) / 100 // bps to percent
      const stopLoss = Number(formatEther(pos.stopLossSTT))

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
