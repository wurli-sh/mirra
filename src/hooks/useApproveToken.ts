import { useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi'
import { maxUint256 } from 'viem'
import { ERC20Abi } from '@/config/abi/ERC20'

export function useApproveToken(tokenAddress: `0x${string}` | undefined, spender: `0x${string}` | undefined) {
  const { address } = useAccount()

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20Abi,
    functionName: 'allowance',
    args: address && spender ? [address, spender] : undefined,
    query: { enabled: !!address && !!tokenAddress && !!spender },
  })

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // Refetch allowance after successful approval
  useEffect(() => {
    if (isSuccess) refetchAllowance()
  }, [isSuccess, refetchAllowance])

  const approve = () => {
    if (!tokenAddress || !spender) return
    writeContract({
      address: tokenAddress,
      abi: ERC20Abi,
      functionName: 'approve',
      args: [spender, maxUint256],
    })
  }

  return {
    allowance: allowance ?? 0n,
    approve,
    isPending,
    isConfirming,
    isSuccess,
    refetchAllowance,
    needsApproval: (amount: bigint) => (allowance ?? 0n) < amount,
  }
}
