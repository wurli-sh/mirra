import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi'
import { formatEther, type Address } from 'viem'
import { contracts } from '@/config/contracts'
import { FollowerVaultAbi } from '@/config/abi/FollowerVault'

export function useClaimFees() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const claim = (token: Address = contracts.sttToken) => {
    writeContract({
      address: contracts.followerVault,
      abi: FollowerVaultAbi,
      functionName: 'claimFees',
      args: [token],
    })
  }

  return { claim, hash, isPending, isConfirming, isSuccess, error }
}

export function usePendingFees(token: Address = contracts.sttToken) {
  const { address } = useAccount()

  const { data } = useReadContract({
    address: contracts.followerVault,
    abi: FollowerVaultAbi,
    functionName: 'pendingFees',
    args: address ? [address, token] : undefined,
    query: { enabled: !!address, refetchInterval: 5_000 },
  })

  return {
    fees: data ? Number(formatEther(data)) : 0,
    feesRaw: data ?? 0n,
  }
}
