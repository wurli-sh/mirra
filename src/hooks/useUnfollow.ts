import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { contracts } from '@/config/contracts'
import { FollowerVaultAbi } from '@/config/abi/FollowerVault'

export function useUnfollow() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const unfollow = (leader: `0x${string}`) => {
    writeContract({
      address: contracts.followerVault,
      abi: FollowerVaultAbi,
      functionName: 'unfollow',
      args: [leader],
    })
  }

  return { unfollow, hash, isPending, isConfirming, isSuccess, error }
}
