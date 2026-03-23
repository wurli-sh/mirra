// @ts-nocheck — server-only, runs via tsx without type checking
import { tool } from 'ai'
import { z } from 'zod'
import { formatEther, parseEther } from 'viem'
import { publicClient, contracts, resolveToken } from '../../lib/viem-client'
import { SimpleDEXAbi } from '../../../src/config/abi/SimpleDEX'
import { LeaderRegistryAbi } from '../../../src/config/abi/LeaderRegistry'

const VALID_PAIRS: Record<string, string[]> = {
  STT: ['USDC', 'WETH'],
  USDC: ['STT'],
  WETH: ['STT'],
}
function isPairValid(a: string, b: string): boolean {
  return VALID_PAIRS[a]?.includes(b) ?? false
}

export const request_swap = tool({
  description: 'Propose a token swap for the user. Returns an ActionCard that the user can confirm in the UI. Always call get_amount_out first to show the estimate.',
  parameters: z.object({
    tokenIn: z.string().optional().describe('Input token symbol (STT, USDC, WETH)'),
    tokenOut: z.string().optional().describe('Output token symbol (STT, USDC, WETH)'),
    amountIn: z.string().optional().describe('Amount to swap (e.g. "10")'),
    // Aliases
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
    const parsedAmt = Number(amountIn)
    if (!isFinite(parsedAmt) || parsedAmt <= 0) {
      return { error: 'amountIn must be a positive number string, e.g. "10"' }
    }
    try {
      const tIn = resolveToken(tokenIn)
      const tOut = resolveToken(tokenOut)
      if (!tIn || !tOut) return { error: `Unknown token "${!tIn ? tokenIn : tokenOut}". Available: STT, USDC, WETH` }
      if (!isPairValid(tIn.symbol, tOut.symbol)) return { error: `No liquidity pool for ${tIn.symbol}↔${tOut.symbol}. Valid pairs: STT↔USDC, STT↔WETH. Swap through STT first.` }

      let estimatedOut = '0'
      try {
        const result = await publicClient.readContract({
          address: contracts.simpleDex,
          abi: SimpleDEXAbi,
          functionName: 'getAmountOut',
          args: [tIn.address, tOut.address, parseEther(amountIn)],
        })
        estimatedOut = formatEther(result as bigint)
      } catch { /* pool may be empty */ }

      return {
        type: 'swap' as const,
        tokenIn: tIn.symbol,
        tokenInAddress: tIn.address,
        tokenOut: tOut.symbol,
        tokenOutAddress: tOut.address,
        amountIn,
        estimatedOut,
        contractAddress: contracts.simpleDex,
      }
    } catch (err) {
      return { error: `Swap failed: ${err instanceof Error ? err.message : 'Unknown error'}` }
    }
  },
})

export const request_follow = tool({
  description: 'Propose following a leader. Use defaults if user does not specify: amount="10", maxPerTrade="5", slippageBps=300, stopLoss="5". Returns an ActionCard.',
  parameters: z.object({
    leader: z.string().describe('Leader wallet address'),
    amount: z.string().default('10').describe('STT deposit amount (default "10")'),
    maxPerTrade: z.string().default('5').describe('Max STT per trade (default "5")'),
    slippageBps: z.number().default(300).describe('Slippage in bps (default 300 = 3%)'),
    stopLoss: z.string().default('5').describe('Stop loss in STT (default "5")'),
  }),
  execute: async (params) => {
    let leader = params.leader
    // Resolve truncated addresses (e.g. "0xFbc8...E066") by searching registered leaders
    if (!leader || leader === 'undefined' || leader.includes('...') || leader.length < 42) {
      try {
        const count = await publicClient.readContract({
          address: contracts.leaderRegistry,
          abi: LeaderRegistryAbi,
          functionName: 'getLeaderCount',
        })
        const prefix = leader?.slice(0, 6).toLowerCase() ?? ''
        const suffix = leader?.slice(-4).toLowerCase() ?? ''
        const candidates = await Promise.all(
          Array.from({ length: Number(count) }, (_, i) =>
            publicClient.readContract({
              address: contracts.leaderRegistry,
              abi: LeaderRegistryAbi,
              functionName: 'getLeaderAt',
              args: [BigInt(i)],
            })
          )
        )
        const matches = candidates.filter(c =>
          !prefix || (c.toLowerCase().startsWith(prefix) && c.toLowerCase().endsWith(suffix))
        )
        if (matches.length === 1) {
          leader = matches[0]
        } else if (matches.length > 1) {
          return { error: `Multiple leaders match "${leader}". Please provide the full address.` }
        }
      } catch { /* fallthrough */ }
      if (!leader || leader.includes('...') || leader.length < 42) {
        return { error: 'Could not resolve leader address. Try asking "who are the top leaders?" first.' }
      }
    }
    const amount = params.amount || '10'
    const maxPerTrade = params.maxPerTrade || '5'
    const slippageBps = params.slippageBps ?? 300
    const stopLoss = params.stopLoss || '5'
    return {
      type: 'follow' as const,
      leader,
      amount,
      maxPerTrade,
      slippageBps,
      stopLoss,
      contractAddress: contracts.followerVault,
      tokenAddress: contracts.sttToken,
    }
  },
})

export const request_unfollow = tool({
  description: 'Propose unfollowing a leader. Returns an ActionCard.',
  parameters: z.object({
    leader: z.string().describe('Leader wallet address to unfollow'),
  }),
  execute: async ({ leader }) => {
    return {
      type: 'unfollow' as const,
      leader,
      contractAddress: contracts.followerVault,
    }
  },
})

export const request_deposit_more = tool({
  description: 'Propose depositing more STT into an existing follow position. Returns an ActionCard.',
  parameters: z.object({
    leader: z.string().describe('Leader wallet address'),
    amount: z.string().describe('Additional STT to deposit'),
  }),
  execute: async ({ leader, amount }) => {
    return {
      type: 'deposit' as const,
      leader,
      amount,
      contractAddress: contracts.followerVault,
      tokenAddress: contracts.sttToken,
    }
  },
})

export const request_withdraw = tool({
  description: 'Propose withdrawing STT from a follow position. Returns an ActionCard.',
  parameters: z.object({
    leader: z.string().describe('Leader wallet address'),
    amount: z.string().describe('STT amount to withdraw'),
  }),
  execute: async ({ leader, amount }) => {
    return {
      type: 'withdraw' as const,
      leader,
      amount,
      contractAddress: contracts.followerVault,
    }
  },
})

export const request_register_leader = tool({
  description: 'Propose registering as a leader by staking STT. Minimum stake is 10 STT (sent as native value). Returns an ActionCard.',
  parameters: z.object({
    stakeAmount: z.string().default('10').describe('STT to stake (minimum 10)'),
  }),
  execute: async ({ stakeAmount }) => {
    return {
      type: 'register' as const,
      stakeAmount: stakeAmount ?? '10',
      contractAddress: contracts.leaderRegistry,
    }
  },
})

export const request_deregister = tool({
  description: 'Propose deregistering as a leader and reclaiming staked STT. Returns an ActionCard.',
  parameters: z.object({}),
  execute: async () => {
    return {
      type: 'deregister' as const,
      contractAddress: contracts.leaderRegistry,
    }
  },
})

export const request_claim_fees = tool({
  description: 'Propose claiming accrued leader fees from the FollowerVault. Specify which token to claim (STT, USDC, or WETH). Returns an ActionCard.',
  parameters: z.object({
    token: z.string().optional().describe('Token to claim fees in (STT, USDC, WETH). Defaults to STT.'),
  }),
  execute: async ({ token }) => {
    return {
      type: 'claimFees' as const,
      contractAddress: contracts.followerVault,
      token: token || 'STT',
    }
  },
})

export const request_approve = tool({
  description: 'Propose approving a token for spending by a contract. Use spender "followerVault" for follow/deposit. Use spender "simpleDex" for swaps.',
  parameters: z.object({
    token: z.string().describe('Token symbol to approve (STT, USDC, WETH)'),
    spender: z.enum(['followerVault', 'simpleDex']).describe('"followerVault" for follow/deposit, "simpleDex" for swaps'),
  }),
  execute: async ({ token, spender }) => {
    const t = resolveToken(token)
    if (!t) return { error: 'Unknown token. Available: STT, USDC, WETH' }

    const spenderAddress = spender === 'followerVault' ? contracts.followerVault : contracts.simpleDex

    return {
      type: 'approve' as const,
      token: t.symbol,
      tokenAddress: t.address,
      spender,
      spenderAddress,
    }
  },
})
