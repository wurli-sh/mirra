import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { contracts } from '@/config/contracts'
import { FollowerVaultAbi } from '@/config/abi/FollowerVault'

export function useWithdrawPosition() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const withdraw = (leader: `0x${string}`, amount: string) => {
    writeContract({
      address: contracts.followerVault,
      abi: FollowerVaultAbi,
      functionName: 'withdraw',
      args: [leader, parseEther(amount)],
    })
  }

  return { withdraw, hash, isPending, isConfirming, isSuccess, error }
}
