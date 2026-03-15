import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { contracts } from '@/config/contracts'
import { FollowerVaultAbi } from '@/config/abi/FollowerVault'

export function useDepositMore() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const deposit = (leader: `0x${string}`, amount: string) => {
    writeContract({
      address: contracts.followerVault,
      abi: FollowerVaultAbi,
      functionName: 'deposit',
      args: [leader, parseEther(amount)],
    })
  }

  return { deposit, hash, isPending, isConfirming, isSuccess, error }
}
