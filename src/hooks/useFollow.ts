import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { contracts } from '@/config/contracts'
import { FollowerVaultAbi } from '@/config/abi/FollowerVault'

export function useFollow() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const follow = (params: {
    leader: `0x${string}`
    amount: string
    maxPerTrade: string
    slippageBps: number
    stopLoss: string
  }) => {
    writeContract({
      address: contracts.followerVault,
      abi: FollowerVaultAbi,
      functionName: 'follow',
      args: [
        params.leader,
        parseEther(params.amount),
        parseEther(params.maxPerTrade),
        params.slippageBps,
        parseEther(params.stopLoss),
      ],
    })
  }

  return { follow, hash, isPending, isConfirming, isSuccess, error }
}
