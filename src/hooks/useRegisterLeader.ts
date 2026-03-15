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

  const { data: isLeader } = useReadContract({
    address: contracts.leaderRegistry,
    abi: LeaderRegistryAbi,
    functionName: 'isLeader',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  return { isLeader: isLeader ?? false }
}

export function useMinStake() {
  const { data } = useReadContract({
    address: contracts.leaderRegistry,
    abi: LeaderRegistryAbi,
    functionName: 'MIN_LEADER_STAKE',
  })

  return data
}
