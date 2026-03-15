import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { contracts } from '@/config/contracts'
import { SimpleDEXAbi } from '@/config/abi/SimpleDEX'

export function useSwap() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const swap = (params: {
    tokenIn: `0x${string}`
    tokenOut: `0x${string}`
    amountIn: string
    minAmountOut: string
  }) => {
    writeContract({
      address: contracts.simpleDex,
      abi: SimpleDEXAbi,
      functionName: 'swap',
      args: [
        params.tokenIn,
        params.tokenOut,
        parseEther(params.amountIn),
        parseEther(params.minAmountOut),
      ],
    })
  }

  return { swap, hash, isPending, isConfirming, isSuccess, error, reset }
}

export function useAmountOut(
  tokenIn: `0x${string}` | undefined,
  tokenOut: `0x${string}` | undefined,
  amountIn: string,
) {
  const parsedAmount = amountIn && Number(amountIn) > 0 ? parseEther(amountIn) : undefined

  const { data, isLoading } = useReadContract({
    address: contracts.simpleDex,
    abi: SimpleDEXAbi,
    functionName: 'getAmountOut',
    args: tokenIn && tokenOut && parsedAmount ? [tokenIn, tokenOut, parsedAmount] : undefined,
    query: { enabled: !!tokenIn && !!tokenOut && !!parsedAmount },
  })

  return {
    amountOut: data ? formatEther(data) : '',
    isLoading,
  }
}

export function useReserves(tokenA: `0x${string}` | undefined, tokenB: `0x${string}` | undefined) {
  const { data } = useReadContract({
    address: contracts.simpleDex,
    abi: SimpleDEXAbi,
    functionName: 'getReserves',
    args: tokenA && tokenB ? [tokenA, tokenB] : undefined,
    query: { enabled: !!tokenA && !!tokenB },
  })

  return {
    reserveA: data ? formatEther(data[0]) : '0',
    reserveB: data ? formatEther(data[1]) : '0',
  }
}
