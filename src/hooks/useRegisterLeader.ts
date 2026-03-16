import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi'
import { parseEther } from 'viem'
import { contracts } from '@/config/contracts'
import { LeaderRegistryAbi } from '@/config/abi/LeaderRegistry'

export function useRegisterLeader() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const register = (stakeAmount: string = '10') => {
    writeContract({
      address: contracts.leaderRegistry,
      abi: LeaderRegistryAbi,
      functionName: 'registerLeader',
      value: parseEther(stakeAmount),
    })
  }

  return { register, hash, isPending, isConfirming, isSuccess, error }
}

export function useIsLeader() {
  const { address } = useAccount()

  const { data: isLeader, isLoading, refetch } = useReadContract({
    address: contracts.leaderRegistry,
    abi: LeaderRegistryAbi,
    functionName: 'isLeader',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5_000 },
  })

  return { isLeader: isLeader ?? false, isLoading, refetch }
}

export function useDeregisterLeader() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const deregister = () => {
    writeContract({
      address: contracts.leaderRegistry,
      abi: LeaderRegistryAbi,
      functionName: 'deregisterLeader',
    })
  }

  return { deregister, hash, isPending, isConfirming, isSuccess, error }
}

export function useMinStake() {
  const { data } = useReadContract({
    address: contracts.leaderRegistry,
    abi: LeaderRegistryAbi,
    functionName: 'MIN_LEADER_STAKE',
  })

  return data
}
