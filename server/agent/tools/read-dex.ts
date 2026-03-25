// @ts-nocheck — server-only, runs via tsx without type checking
import { tool } from 'ai'
import { z } from 'zod'
import { formatEther, parseEther, type Address } from 'viem'
import { publicClient, contracts, resolveToken } from '../../lib/viem-client'
import { SimpleDEXAbi } from '../../../src/config/abi/SimpleDEX'
import { ERC20Abi } from '../../../src/config/abi/ERC20'

// Only STT↔USDC and STT↔WETH have liquidity. USDC↔WETH has no pool.
const VALID_PAIRS: Record<string, string[]> = {
  STT: ['USDC', 'WETH'],
  USDC: ['STT'],
  WETH: ['STT'],
}

function isPairValid(a: string, b: string): boolean {
  return VALID_PAIRS[a]?.includes(b) ?? false
}

export const get_amount_out = tool({
  description: 'Get the estimated output amount for a swap. Use before proposing a swap to show the user what they\'ll receive.',
  parameters: z.object({
    tokenIn: z.string().optional().describe('Input token symbol (STT, USDC, WETH)'),
    tokenOut: z.string().optional().describe('Output token symbol (STT, USDC, WETH)'),
    amountIn: z.string().optional().describe('Amount of input token (e.g. "10")'),
    // Aliases — qwen3 sometimes uses these names
    fromToken: z.string().optional(),
    toToken: z.string().optional(),
    amount: z.string().optional(),
  }),
  execute: async (params) => {
    const tokenIn = params.tokenIn ?? params.fromToken
    const tokenOut = params.tokenOut ?? params.toToken
    const amountIn = params.amountIn ?? params.amount
    if (!tokenIn || !tokenOut || !amountIn) {
      return { error: 'Missing parameters. Need: tokenIn, tokenOut, amountIn' }
    }
    try {
      const tIn = resolveToken(tokenIn)
      const tOut = resolveToken(tokenOut)
      if (!tIn || !tOut) return { error: `Unknown token "${!tIn ? tokenIn : tokenOut}". Available: STT, USDC, WETH` }
      if (!isPairValid(tIn.symbol, tOut.symbol)) return { error: `No liquidity pool for ${tIn.symbol}↔${tOut.symbol}. Valid pairs: STT↔USDC, STT↔WETH. Swap through STT first.` }

      const parsedAmt = Number(amountIn)
      if (!isFinite(parsedAmt) || parsedAmt <= 0) {
        return { error: 'amountIn must be a positive number string, e.g. "10"' }
      }
      console.log(`[tool] get_amount_out: ${amountIn} ${tIn.symbol} → ${tOut.symbol}`)
      const result = await publicClient.readContract({
        address: contracts.simpleDex,
        abi: SimpleDEXAbi,
        functionName: 'getAmountOut',
        args: [tIn.address, tOut.address, parseEther(amountIn)],
      })
      const out = formatEther(result as bigint)
      console.log(`[tool] get_amount_out result: ${out}`)
      return {
        tokenIn: tIn.symbol,
        tokenOut: tOut.symbol,
        amountIn,
        amountOut: out,
      }
    } catch (err) {
      console.error(`[tool] get_amount_out ERROR:`, err instanceof Error ? err.message.slice(0, 200) : 'unknown')
      return { error: `Could not get quote: ${err instanceof Error ? err.message.slice(0, 200) : 'pool may have no liquidity'}` }
    }
  },
})

export const get_reserves = tool({
  description: 'Get the liquidity reserves for a token pair on SimpleDEX.',
  parameters: z.object({
    tokenA: z.string().describe('First token symbol or address'),
    tokenB: z.string().describe('Second token symbol or address'),
  }),
  execute: async ({ tokenA, tokenB }) => {
    const tA = resolveToken(tokenA)
    const tB = resolveToken(tokenB)
    if (!tA || !tB) return { error: 'Unknown token. Available: STT, USDC, WETH' }

    try {
      const result = await publicClient.readContract({
        address: contracts.simpleDex,
        abi: SimpleDEXAbi,
        functionName: 'getReserves',
        args: [tA.address, tB.address],
      })

      return {
        [tA.symbol]: formatEther(result[0]),
        [tB.symbol]: formatEther(result[1]),
      }
    } catch (err) {
      return { error: `Could not get reserves for ${tA.symbol}/${tB.symbol}: ${err instanceof Error ? err.message.slice(0, 200) : 'pool may not exist'}` }
    }
  },
})

export function makeGetTokenBalances(userAddress?: string) {
  return tool({
    description: 'Get the connected user\'s token balances for STT, USDC, and WETH.',
    parameters: z.object({}),
    execute: async () => {
      if (!userAddress) return { error: 'No wallet connected.' }
      const addr = userAddress as Address

      const [sttBal, usdcBal, wethBal] = await Promise.all([
        publicClient.readContract({
          address: contracts.sttToken,
          abi: ERC20Abi,
          functionName: 'balanceOf',
          args: [addr],
        }),
        publicClient.readContract({
          address: contracts.usdcToken,
          abi: ERC20Abi,
          functionName: 'balanceOf',
          args: [addr],
        }),
        publicClient.readContract({
          address: contracts.wethToken,
          abi: ERC20Abi,
          functionName: 'balanceOf',
          args: [addr],
        }),
      ])

      return {
        STT: formatEther(sttBal),
        USDC: formatEther(usdcBal),
        WETH: formatEther(wethBal),
      }
    },
  })
}
