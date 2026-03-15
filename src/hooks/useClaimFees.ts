import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi'
import { formatEther } from 'viem'
import { contracts } from '@/config/contracts'
import { FollowerVaultAbi } from '@/config/abi/FollowerVault'

export function useClaimFees() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const claim = () => {
    writeContract({
      address: contracts.followerVault,
      abi: FollowerVaultAbi,
      functionName: 'claimFees',
    })
  }

  return { claim, hash, isPending, isConfirming, isSuccess, error }
}

export function usePendingFees() {
  const { address } = useAccount()

  const { data } = useReadContract({
    address: contracts.followerVault,
    abi: FollowerVaultAbi,
    functionName: 'pendingFees',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  return {
    fees: data ? Number(formatEther(data)) : 0,
    feesRaw: data ?? 0n,
  }
}
